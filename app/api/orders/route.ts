import { NextRequest, NextResponse } from 'next/server';
import { dbRun, dbGet, dbAll, ensureDbReady } from '@/lib/db';
import { sendOrderStatusUpdateEmail } from '@/lib/mail';
import { verifyAdminSession, unauthorizedResponse, verifyCustomerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await ensureDbReady();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantId = 'dishdash-solo';

    if (id) {
      const order = await dbGet('SELECT * FROM orders WHERE id = ? AND tenant_id = ?', [id, tenantId]);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [id]);
      return NextResponse.json({ ...order, items });
    }

    const orders = await dbAll('SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC', [tenantId]);
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await ensureDbReady();
  
  try {
    const body = await request.json();
    const { tenant_id, customer_name, customer_phone, payment_type, items, address } = body;
    
    if (!tenant_id || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    let totalAmount = 0;
    
    for (const item of items) {
      totalAmount += (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }
    
    const now = Date.now();
    
    // Create order
    await dbRun(`
      INSERT INTO orders (id, tenant_id, customer_name, customer_phone, status, total_amount, payment_status, payment_type, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'placed', ?, 'pending', ?, ?, ?, ?)
    `, [orderId, tenant_id, customer_name, customer_phone, totalAmount, payment_type, address || null, now, now]);

    // Create order items and deduct stock only for direct/offline payments (like UPI)
    for (const item of items) {
      await dbRun(`
        INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [crypto.randomUUID(), orderId, item.product_id, item.product_name, item.price, item.quantity]);

      if (payment_type !== 'payu' && payment_type !== 'razorpay') {
        // Fetch product to update stock
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
    }

    // Handle Khata (Store Credit) payment logic
    if (payment_type === 'khata' && customer_phone) {
      const customer = await dbGet(`
        SELECT sc.id, sc.customer_id 
        FROM store_customers sc 
        JOIN customers c ON sc.customer_id = c.id 
        WHERE sc.tenant_id = ? AND c.phone = ?
      `, [tenant_id, customer_phone]);

      if (customer) {
        // Record khata transaction
        await dbRun(`
          INSERT INTO khata_entries (id, tenant_id, customer_id, type, amount, description, order_id, created_at)
          VALUES (?, ?, ?, 'debit', ?, ?, ?, ?)
        `, [crypto.randomUUID(), tenant_id, customer.customer_id, totalAmount, 'Store Purchase', orderId, now]);
        
        // Mark order as paid for khata
        await dbRun('UPDATE orders SET payment_status = "paid" WHERE id = ?', [orderId]);
      }
    }

    return NextResponse.json({ id: orderId, total: totalAmount, success: true });
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Only admins can update order status/remarks
  if (!verifyAdminSession(request)) return unauthorizedResponse();
  try {
    await ensureDbReady();
    const body = await request.json();
    const { id, status, payment_status, remarks } = body;

    if (!id || (!status && !payment_status && remarks === undefined)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';
    const now = Date.now();
    
    // Build update dynamic parameters
    if (status && payment_status) {
      await dbRun(
        'UPDATE orders SET status = ?, payment_status = ?, remarks = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
        [status, payment_status, remarks || null, now, id, tenantId]
      );
    } else if (status) {
      await dbRun(
        'UPDATE orders SET status = ?, remarks = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
        [status, remarks || null, now, id, tenantId]
      );
    } else if (payment_status) {
      await dbRun(
        'UPDATE orders SET payment_status = ?, remarks = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
        [payment_status, remarks || null, now, id, tenantId]
      );
    } else if (remarks !== undefined) {
      await dbRun(
        'UPDATE orders SET remarks = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
        [remarks || null, now, id, tenantId]
      );
    }

    // Retrieve order and dispatch HTML email alert to customer
    try {
      const order = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
      if (order) {
        // Query customer table for associated email matching the phone number
        const customer = await dbGet('SELECT email FROM customers WHERE phone = ?', [order.customer_phone]);
        const recipientEmail = customer?.email || (order.customer_phone.includes('@') ? order.customer_phone : null);

        if (recipientEmail) {
          await sendOrderStatusUpdateEmail({
            to: recipientEmail,
            customerName: order.customer_name,
            orderId: order.id,
            status: status || order.status,
            paymentStatus: payment_status || order.payment_status,
            remarks: remarks !== undefined ? remarks : order.remarks
          });
        }
      }
    } catch (mailErr) {
      console.error('Failed to dispatch status email:', mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
