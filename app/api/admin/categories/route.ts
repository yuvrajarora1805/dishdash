import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbRun, dbGet, ensureDbReady } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { connection } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connection();
    await ensureDbReady();
    const tenantId = 'dishdash-solo';

    // Get all categories for solo tenant
    const allRows = await dbAll(
      'SELECT id, name, parent_id FROM categories WHERE tenant_id = ? ORDER BY sort_order ASC, name ASC',
      [tenantId]
    );

    // Group subcategories under parents
    const parents = allRows.filter((r: any) => !r.parent_id);
    const children = allRows.filter((r: any) => r.parent_id);

    const tree = parents.map((p: any) => {
      const subcategories = children
        .filter((c: any) => c.parent_id === p.id)
        .map((c: any) => ({ id: c.id, name: c.name }));

      return {
        id: p.id,
        name: p.name,
        subcategories
      };
    });

    return NextResponse.json(tree);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    await ensureDbReady();
    const body = await request.json();
    const { name, parent_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';
    const id = uuidv4();

    await dbRun(
      'INSERT INTO categories (id, tenant_id, name, parent_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, tenantId, name, parent_id || null, Date.now()]
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connection();
    await ensureDbReady();
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }

    await dbRun(
      "UPDATE categories SET name = ? WHERE id = ? AND tenant_id = 'dishdash-solo'",
      [name, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connection();
    await ensureDbReady();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    const tenantId = 'dishdash-solo';

    // Delete subcategories first (if this is a parent category)
    await dbRun(
      'DELETE FROM categories WHERE parent_id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    // Delete the category itself
    await dbRun(
      'DELETE FROM categories WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
