import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbRun, dbGet, ensureDbReady } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { name, phone, email, password } = body;

    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: 'Missing required signup parameters' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';

    // Verify if customer already exists
    const existing = await dbGet('SELECT * FROM customers WHERE tenant_id = ? AND email = ?', [tenantId, email]);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const customerId = crypto.randomUUID();
    // Simple SHA256 hashing for password safety
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const now = Date.now();

    // Insert user account
    await dbRun(`
      INSERT INTO customers (id, tenant_id, name, phone, email, password, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [customerId, tenantId, name, phone, email, hashedPassword, now]);

    // Create default Store Customer details (with 15k store credit limit)
    await dbRun(`
      INSERT INTO store_customers (id, tenant_id, customer_id, khata_status, khata_limit, created_at, updated_at)
      VALUES (?, ?, ?, 'active', 15000, ?, ?)
    `, [crypto.randomUUID(), tenantId, customerId, now, now]);

    const response = NextResponse.json({ success: true, message: 'Account registered successfully!' });

    // Automatically set session cookie on register
    response.cookies.set('customer_session', customerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('Registration API error:', error);
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
      if (error.message?.includes('phone_idx') || error.message?.includes('phone')) {
        return NextResponse.json({ error: 'This phone number is already registered. Please sign in or use another number.' }, { status: 409 });
      }
      if (error.message?.includes('email') || error.message?.includes('key 2')) {
        return NextResponse.json({ error: 'This email address is already registered. Please sign in or use another email.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'An account with this email or phone number is already registered.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Registration failed: ' + (error?.message || error) }, { status: 500 });
  }
}
