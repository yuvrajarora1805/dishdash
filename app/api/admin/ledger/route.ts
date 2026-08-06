import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbAll, dbRun, dbGet, ensureDbReady } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth';
import { sendKhataSettlementEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) return unauthorizedResponse();
  try {
    await ensureDbReady();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';
    const entries = await dbAll(
      'SELECT * FROM khata_entries WHERE customer_id = ? AND tenant_id = ? ORDER BY created_at DESC',
      [customerId, tenantId]
    );

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('Fetch ledger API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve ledger entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSession(request)) return unauthorizedResponse();
  try {
    await ensureDbReady();
    const body = await request.json();
    const { customerId, type, amount, description } = body;

    if (!customerId || !type || !amount) {
      return NextResponse.json({ error: 'Customer ID, type, and amount are required' }, { status: 400 });
    }

    if (type !== 'credit' && type !== 'debit') {
      return NextResponse.json({ error: 'Invalid entry type. Must be credit or debit' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';
    const entryId = crypto.randomUUID();
    const now = Date.now();

    await dbRun(`
      INSERT INTO khata_entries (id, tenant_id, customer_id, type, amount, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [entryId, tenantId, customerId, type, Number(amount), description || null, now]);

    if (type === 'debit') {
      const customer = await dbGet('SELECT name, email FROM customers WHERE id = ?', [customerId]);
      if (customer && customer.email) {
        const dateStr = new Date(now).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        await sendKhataSettlementEmail({
          to: customer.email,
          customerName: customer.name,
          amount: Number(amount),
          description: description || 'Payment Received',
          date: dateStr
        }).catch(err => console.error('Failed to send khata email:', err));
      }
    }

    return NextResponse.json({ success: true, message: 'Ledger entry successfully recorded!' });
  } catch (error: any) {
    console.error('Add ledger entry error:', error);
    return NextResponse.json({ error: 'Failed to record ledger entry' }, { status: 500 });
  }
}
