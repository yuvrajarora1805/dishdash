import { NextResponse } from 'next/server';
import { dbAll, dbRun, dbGet, ensureDbReady } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    await ensureDbReady();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    // Default to solo tenant for storefront
    const activeTenant = tenantId || 'dishdash-solo';
    let query = 'SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC';
    const params = [activeTenant];

    if (searchParams.get('trending') === 'true') {
        query = 'SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 8';
    }

    const rows = await dbAll(query, params);

    const products = rows.map((p: any) => ({
        ...p,
        images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
        data: p.data ? (typeof p.data === 'string' ? JSON.parse(p.data) : p.data) : {}
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { name, price, description, images, tag, is_trending, stock, subcategory, variants } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = uuidv4();
    const tenantId = 'dishdash-solo';
    const imagesStr = JSON.stringify(images || []);
    const dataStr = JSON.stringify({ 
      tag: tag || 'General', 
      subcategory: subcategory || '',
      description: description || '',
      is_trending: !!is_trending,
      stock: Number(stock) || 0,
      variants: variants || []
    });

    await dbRun(`
      INSERT INTO products (id, tenant_id, name, price, images, data, category_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `, [id, tenantId, name, Number(price), imagesStr, dataStr, Date.now(), Date.now()]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { id, name, price, description, images, tag, is_trending, stock, subcategory, variants } = body;

    if (!id || !name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const imagesStr = JSON.stringify(images || []);
    const dataStr = JSON.stringify({ 
      tag: tag || 'General', 
      subcategory: subcategory || '',
      description: description || '',
      is_trending: !!is_trending,
      stock: Number(stock) || 0,
      variants: variants || []
    });

    await dbRun(`
      UPDATE products 
      SET name = ?, price = ?, images = ?, data = ?, updated_at = ?
      WHERE id = ? AND tenant_id = 'dishdash-solo'
    `, [name, Number(price), imagesStr, dataStr, Date.now(), id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDbReady();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    await dbRun(`
      DELETE FROM products WHERE id = ? AND tenant_id = 'dishdash-solo'
    `, [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
