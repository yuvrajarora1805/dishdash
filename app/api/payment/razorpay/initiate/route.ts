import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Order ID and Amount parameters are required' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TMQrfdc7r2U5Er';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'LoMCeIsxalynMR2F0H5lJ2UE';

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(Number(amount) * 100), // amount in paisa (subunits)
      currency: 'INR',
      receipt: orderId,
    };

    const rzpOrder = await instance.orders.create(options);
    
    return NextResponse.json({
      success: true,
      keyId,
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (error: any) {
    console.error('Razorpay Order creation failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create payment order' }, { status: 500 });
  }
}
