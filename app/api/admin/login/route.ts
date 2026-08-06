import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      console.error('FATAL: ADMIN_USERNAME and ADMIN_PASSWORD environment variables are not set.');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    if (username === adminUser && password === adminPass) {
      // Create a secure token using hmac of the password
      const token = crypto
        .createHmac('sha256', adminPass)
        .update(adminUser)
        .digest('hex');

      const response = NextResponse.json({ success: true });
      
      // Set secure cookie
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
