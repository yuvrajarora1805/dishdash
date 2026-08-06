import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ensureDbReady } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { txnid, amount, productinfo, firstname, email, phone, udf1 } = body;

    if (!txnid || !amount || !productinfo || !firstname || !phone || !udf1) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const key = process.env.PAYU_MERCHANT_KEY || 'gtKpxx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELSp';
    const actionUrl = process.env.PAYU_ACTION_URL || 'https://sandboxsecure.payu.in/_payment';

    // Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email || ''}|${udf1}|||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    return NextResponse.json({
      success: true,
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email: email || '',
      phone,
      udf1,
      hash,
      actionUrl,
      surl: `${request.nextUrl.origin}/api/payment/payu/callback`,
      furl: `${request.nextUrl.origin}/api/payment/payu/callback`
    });

  } catch (error: any) {
    console.error('Error initiating PayU payment:', error);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
