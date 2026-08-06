import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbAll, dbRun, dbGet, ensureDbReady } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) return unauthorizedResponse();
  try {
    await ensureDbReady();
    const tenantId = 'dishdash-solo';
    
    const customers = await dbAll(`
      SELECT sc.id, c.id as customer_id, c.name, c.phone, c.email, sc.created_at, sc.khata_limit,
        COALESCE((SELECT SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) FROM khata_entries WHERE customer_id = c.id AND tenant_id = sc.tenant_id), 0) as credit_balance
      FROM store_customers sc
      JOIN customers c ON sc.customer_id = c.id
      WHERE sc.tenant_id = ? 
      ORDER BY sc.created_at DESC
    `, [tenantId]);

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Fetch admin customers error:', error);
    return NextResponse.json({ error: 'Failed to retrieve customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSession(request)) return unauthorizedResponse();
  try {
    await ensureDbReady();
    const body = await request.json();
    const { name, phone, email, khata_limit } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone Number are required fields' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';

    // Verify duplicate phone number constraint
    const existing = await dbGet('SELECT * FROM customers WHERE tenant_id = ? AND phone = ?', [tenantId, phone]);
    if (existing) {
      return NextResponse.json({ error: 'This phone number is already registered under another account.' }, { status: 409 });
    }

    const customerId = crypto.randomUUID();
    const placeholderPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.createHash('sha256').update(placeholderPassword).digest('hex');
    const now = Date.now();

    // Insert new customer record
    await dbRun(`
      INSERT INTO customers (id, tenant_id, name, phone, email, password, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [customerId, tenantId, name, phone, email || null, hashedPassword, now]);

    // Initialize store customer khata limit
    const limit = Number(khata_limit) || 15000;
    await dbRun(`
      INSERT INTO store_customers (id, tenant_id, customer_id, khata_status, khata_limit, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?, ?)
    `, [crypto.randomUUID(), tenantId, customerId, limit, now, now]);

    return NextResponse.json({ success: true, message: 'Customer account successfully added!' });
  } catch (error: any) {
    console.error('Manual customer registration error:', error);
    return NextResponse.json({ error: 'Failed to manually add customer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminSession(request)) return unauthorizedResponse();
  try {
    await ensureDbReady();
    const body = await request.json();
    const { customerId, khata_limit } = body;

    if (!customerId || khata_limit === undefined) {
      return NextResponse.json({ error: 'Customer ID and new limit are required' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';
    await dbRun(
      'UPDATE store_customers SET khata_limit = ?, updated_at = ? WHERE customer_id = ? AND tenant_id = ?',
      [Number(khata_limit), Date.now(), customerId, tenantId]
    );

    return NextResponse.json({ success: true, message: 'Credit limit updated successfully!' });
  } catch (error: any) {
    console.error('Update limit error:', error);
    return NextResponse.json({ error: 'Failed to update credit limit' }, { status: 500 });
  }
}

