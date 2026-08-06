import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbGet, ensureDbReady } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const customer = await dbGet(
      'SELECT * FROM customers WHERE tenant_id = ? AND email = ? AND password = ?',
      [tenantId, email, hashedPassword]
    );

    if (!customer) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || ''
      }
    });

    // Set secure HTTPOnly cookie
    response.cookies.set('customer_session', customer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Authentication failed due to server error' }, { status: 500 });
  }
}
