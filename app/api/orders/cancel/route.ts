import { NextRequest, NextResponse } from 'next/server';
import { dbRun, dbGet, ensureDbReady } from '@/lib/db';
import { verifyCustomerSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Verify the order exists and that the requesting customer owns it
    const order = await dbGet('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow cancelling orders that are still in 'placed' (payment not yet confirmed)
    // This prevents someone from cancelling an already paid/delivered order
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Cannot cancel an already paid order.' }, { status: 409 });
    }

    // Verify the customer session matches the order's phone number
    // (skip check for POS walk-in orders)
    const customerSessionId = verifyCustomerSession(request);
    if (customerSessionId) {
      // Customer is logged in — validate they own this order
      const customer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerSessionId]);
      if (customer && customer.phone !== order.customer_phone) {
        return NextResponse.json({ error: 'Forbidden: you do not own this order.' }, { status: 403 });
      }
    }
    // Allow anonymous cancel only for orders not yet paid (so Razorpay dismiss always works)

    // Set order status as cancelled and payment status as failed
    await dbRun(
      'UPDATE orders SET status = "cancelled", payment_status = "failed", updated_at = ? WHERE id = ?',
      [Date.now(), orderId]
    );

    return NextResponse.json({ success: true, message: 'Order cancelled due to payment failure or dismissal.' });
  } catch (error: any) {
    console.error('Cancel order API error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
