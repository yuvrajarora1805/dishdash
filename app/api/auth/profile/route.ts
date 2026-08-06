import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbRun, dbAll, ensureDbReady } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await ensureDbReady();
    const customerSession = request.cookies.get('customer_session')?.value;
    
    if (!customerSession) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const customer = await dbGet(
      'SELECT id, name, phone, email, address, created_at FROM customers WHERE id = ?',
      [customerSession]
    );

    if (!customer) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Retrieve order histories matching customer phone
    const orders = await dbAll(
      'SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC',
      [customer.phone]
    );

    const ordersWithItems = [];
    for (const order of orders) {
      const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      ordersWithItems.push({
        ...order,
        items: items || []
      });
    }

    return NextResponse.json({ customer, orders: ordersWithItems });
  } catch (error: any) {
    console.error('Fetch profile API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve profile details' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const customerSession = request.cookies.get('customer_session')?.value;
    
    if (!customerSession) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, address } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Name, email, and phone number are required' }, { status: 400 });
    }

    // Update customer details in DB
    await dbRun(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone, email, address || null, customerSession]
    );

    // Fetch updated payload to return to client
    const updatedCustomer = await dbGet(
      'SELECT id, name, phone, email, address FROM customers WHERE id = ?',
      [customerSession]
    );

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json({ error: 'Failed to update profile details' }, { status: 500 });
  }
}
