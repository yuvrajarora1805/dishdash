import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, ensureDbReady } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { verifyCustomerSession } from '@/lib/auth';

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  await ensureDbReady();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const reviews = await dbAll(
    `SELECT id, customer_name, rating, review_text, created_at
     FROM reviews
     WHERE product_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [productId]
  );

  // Compute aggregated stats
  const total = reviews.length;
  const avgRating = total > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total
    : 0;

  // Distribution: count per star 1-5
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++;
  }

  return NextResponse.json({ reviews, total, avgRating, distribution });
}

// POST /api/reviews — submit a review (must be logged in)
export async function POST(req: NextRequest) {
  await ensureDbReady();

  let customerId: string | null = null;
  let customerName = 'Anonymous';

  // Try to get logged-in customer (optional — allow guests too)
  const customerIdStr = verifyCustomerSession(req);
  if (customerIdStr) {
    customerId = customerIdStr;
    const customerRow = await dbGet('SELECT name FROM customers WHERE id = ?', [customerIdStr]);
    if (customerRow) customerName = customerRow.name;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { productId, rating, reviewText, guestName } = body;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'productId and rating (1-5) are required' }, { status: 400 });
  }

  // Use guest name if provided and not logged in
  if (!customerIdStr && guestName) customerName = guestName;

  // Prevent duplicate review from same customer on same product
  if (customerId) {
    const existing = await dbGet(
      'SELECT id FROM reviews WHERE product_id = ? AND customer_id = ?',
      [productId, customerId]
    );
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 });
    }
  }

  const id = uuidv4();
  await dbRun(
    'INSERT INTO reviews (id, product_id, customer_id, customer_name, rating, review_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, productId, customerId || null, customerName, rating, reviewText || null, Date.now()]
  );

  // Re-fetch aggregated stats
  const reviews = await dbAll(
    'SELECT id, customer_name, rating, review_text, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 50',
    [productId]
  );
  const total = reviews.length;
  const avgRating = total > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total
    : 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++;
  }

  return NextResponse.json({ success: true, reviews, total, avgRating, distribution }, { status: 201 });
}
