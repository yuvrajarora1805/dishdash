import { NextRequest, NextResponse } from 'next/server';
import { dbRun, ensureDbReady } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Set order status as cancelled and payment status as failed
    await dbRun(
      'UPDATE orders SET status = "cancelled", payment_status = "failed", updated_at = ? WHERE id = ?',
      [Date.now(), orderId]
    );

    return NextResponse.json({ success: true, message: 'Order auto-cancelled due to payment failure or dismiss' });
  } catch (error: any) {
    console.error('Cancel order API error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
