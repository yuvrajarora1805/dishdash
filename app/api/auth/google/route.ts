import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbGet, dbRun, ensureDbReady } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json({ error: 'Google credential token is required' }, { status: 400 });
    }

    // Decode JWT payload (standard Base64 URL decoding)
    const payloadParts = credential.split('.');
    if (payloadParts.length < 2) {
      return NextResponse.json({ error: 'Invalid Google token structure' }, { status: 400 });
    }
    
    const base64Payload = payloadParts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedString = Buffer.from(base64Payload, 'base64').toString('utf8');
    const googleUser = JSON.parse(decodedString);

    const { email, name, sub: googleId } = googleUser;
    
    if (!email) {
      return NextResponse.json({ error: 'Failed to retrieve email from Google session' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';
    
    // Check if account already exists
    let customer = await dbGet('SELECT * FROM customers WHERE tenant_id = ? AND email = ?', [tenantId, email]);

    if (!customer) {
      const customerId = crypto.randomUUID();
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.createHash('sha256').update(randomPassword).digest('hex');
      const placeholderPhone = `G-${googleId.slice(-6)}`;
      const now = Date.now();

      // Register new user details
      await dbRun(`
        INSERT INTO customers (id, tenant_id, name, phone, email, password, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [customerId, tenantId, name, placeholderPhone, email, hashedPassword, now]);

      // Initialize default Store credit details
      await dbRun(`
        INSERT INTO store_customers (id, tenant_id, customer_id, khata_status, khata_limit, created_at, updated_at)
        VALUES (?, ?, ?, 'active', 15000, ?, ?)
      `, [crypto.randomUUID(), tenantId, customerId, now, now]);

      customer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
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
    console.error('Google Sign In API error:', error);
    return NextResponse.json({ error: 'Google Authentication failed due to server error' }, { status: 500 });
  }
}
