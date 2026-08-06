import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbRun, dbGet, dbAll, ensureDbReady } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ error: 'Missing payment signature verification parameters' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'LoMCeIsxalynMR2F0H5lJ2UE';

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Mark transaction status as failed and cancel order if hash signature mismatches
      await dbRun('UPDATE orders SET payment_status = "failed", status = "cancelled" WHERE id = ?', [orderId]);
      return NextResponse.json({ success: false, error: 'Signature verification failed' }, { status: 400 });
    }

    // Success transaction: update DB records
    await dbRun('UPDATE orders SET payment_status = "paid" WHERE id = ?', [orderId]);
    
    // Deduct stock for all items in the order
    try {
      const orderItems = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of orderItems) {
        const product = await dbGet('SELECT * FROM products WHERE id = ?', [item.product_id]);
        if (product) {
          let productData: any = {};
          try {
            productData = typeof product.data === 'string' ? JSON.parse(product.data) : (product.data || {});
          } catch (e) {
            productData = {};
          }
          const currentStock = Number(productData.stock) || 0;
          const qtyOrdered = Number(item.quantity) || 1;
          const newStock = Math.max(0, currentStock - qtyOrdered);
          
          const updatedData = { ...productData, stock: newStock };
          await dbRun('UPDATE products SET data = ?, updated_at = ? WHERE id = ?', [JSON.stringify(updatedData), Date.now(), item.product_id]);
        }
      }
    } catch (err) {
      console.error('Failed to deduct stock in Razorpay callback:', err);
    }

    return NextResponse.json({ success: true, message: 'Payment successfully processed & verified!' });
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json({ error: error?.message || 'Verification error' }, { status: 500 });
  }
}
