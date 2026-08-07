import mysql from 'mysql2/promise';

export const DELIVERY_CHARGE = 40;

let _pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'storex',
      password: process.env.DB_PASSWORD || 'storex_password',
      database: process.env.DB_NAME || 'storex',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log(`[DB-Solo] MySQL pool created for ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}/${process.env.DB_NAME || 'storex'}`);
  }
  return _pool;
}

export async function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as any[];
}

export async function dbGet(sql: string, params: any[] = []): Promise<any | null> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  const arr = rows as any[];
  return arr.length > 0 ? arr[0] : null;
}

export async function dbRun(sql: string, params: any[] = []): Promise<any> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result;
}

// Ensure the standalone tenant exists
export async function initSoloTenant(): Promise<void> {
  const tenantId = 'dishdash-solo';
  const existing = await dbGet('SELECT id FROM tenants WHERE id = ?', [tenantId]);
  if (!existing) {
    await dbRun(
      'INSERT INTO tenants (id, name, slug, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
      [tenantId, 'DishDash Solo', 'solo', 1, Date.now()]
    );
    console.log('[DB-Solo] Created dishdash-solo tenant in DB.');
  }
}

let _dbReadyPromise: Promise<void> | null = null;

export function ensureDbReady(): Promise<void> {
  if (!_dbReadyPromise) {
    _dbReadyPromise = (async () => {
      console.log('[DB-Solo] Ensuring database tables exist...');
      try {
        // Create tables
        await dbRun(`
          CREATE TABLE IF NOT EXISTS tenants (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            is_active TINYINT DEFAULT 1,
            created_at BIGINT NOT NULL
          )
        `);

        await dbRun(`
          CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            parent_id VARCHAR(255) DEFAULT NULL,
            sort_order INT DEFAULT 0,
            created_at BIGINT NOT NULL
          )
        `);

        await dbRun(`
          CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            images TEXT,
            data TEXT,
            category_id VARCHAR(255),
            created_at BIGINT NOT NULL,
            updated_at BIGINT NOT NULL
          )
        `);

        await dbRun(`
          CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            password VARCHAR(255) NOT NULL,
            created_at BIGINT NOT NULL
          )
        `);

        // Dynamically add email column if it is a legacy table
        try {
          await dbRun('ALTER TABLE customers ADD COLUMN email VARCHAR(255)');
        } catch (e) {}

        // Dynamically add address column if it is a legacy table
        try {
          await dbRun('ALTER TABLE customers ADD COLUMN address TEXT');
        } catch (e) {}

        // Dynamically add address column to orders table if it is a legacy table
        try {
          await dbRun('ALTER TABLE orders ADD COLUMN address TEXT');
        } catch (e) {}

        // Dynamically add payment_status column to orders table if it is a legacy table
        try {
          await dbRun('ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT "pending"');
        } catch (e) {}

        // Dynamically add remarks column to orders table if it is a legacy table
        try {
          await dbRun('ALTER TABLE orders ADD COLUMN remarks TEXT');
        } catch (e) {}

        // Dynamically add parent_id to categories table if it doesn't exist
        try {
          await dbRun('ALTER TABLE categories ADD COLUMN parent_id VARCHAR(255) DEFAULT NULL');
        } catch (e) {}

        // Seed initial categories if none exist
        try {
          const catCount = await dbGet('SELECT COUNT(*) as count FROM categories WHERE tenant_id = ?', ['dishdash-solo']);
          if (catCount && catCount.count === 0) {
            console.log('[DB-Solo] Seeding initial categories...');
            const defaultCats = [
              { name: 'Electronics', subs: ['Audio', 'Smart Home', 'Wearables'] },
              { name: 'Daily Essentials', subs: ['Home', 'Kitchen', 'Lifestyle'] }
            ];
            const { v4: uuidv4 } = require('uuid');
            for (const c of defaultCats) {
              const parentId = uuidv4();
              await dbRun(
                'INSERT INTO categories (id, tenant_id, name, parent_id, created_at) VALUES (?, ?, ?, NULL, ?)',
                [parentId, 'dishdash-solo', c.name, Date.now()]
              );
              for (const sub of c.subs) {
                await dbRun(
                  'INSERT INTO categories (id, tenant_id, name, parent_id, created_at) VALUES (?, ?, ?, ?, ?)',
                  [uuidv4(), 'dishdash-solo', sub, parentId, Date.now()]
                );
              }
            }
            console.log('[DB-Solo] Categories seeded successfully.');
          }
        } catch (seedErr) {
          console.error('[DB-Solo] Failed to seed categories:', seedErr);
        }

        await dbRun(`
          CREATE TABLE IF NOT EXISTS store_customers (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255) NOT NULL,
            khata_status VARCHAR(50) DEFAULT 'active',
            khata_limit INT DEFAULT 0,
            created_at BIGINT NOT NULL,
            updated_at BIGINT NOT NULL
          )
        `);

        await dbRun(`
          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(255) NOT NULL,
            payment_type VARCHAR(50) NOT NULL,
            payment_status VARCHAR(50) DEFAULT 'pending',
            status VARCHAR(50) DEFAULT 'placed',
            total_amount INT NOT NULL,
            delivery_charge INT DEFAULT 0,
            created_at BIGINT NOT NULL,
            updated_at BIGINT NOT NULL
          )
        `);

        // Dynamically add delivery_charge column if it is a legacy table
        try {
          await dbRun('ALTER TABLE orders ADD COLUMN delivery_charge INT DEFAULT 0');
        } catch (e) {}

        await dbRun(`
          CREATE TABLE IF NOT EXISTS order_items (
            id VARCHAR(255) PRIMARY KEY,
            order_id VARCHAR(255) NOT NULL,
            product_id VARCHAR(255) NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            quantity INT DEFAULT 1,
            price INT NOT NULL
          )
        `);

        await dbRun(`
          CREATE TABLE IF NOT EXISTS khata_entries (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            amount INT NOT NULL,
            description VARCHAR(255),
            order_id VARCHAR(255),
            created_at BIGINT NOT NULL
          )
        `);

        await dbRun(`
          CREATE TABLE IF NOT EXISTS reviews (
            id VARCHAR(255) PRIMARY KEY,
            product_id VARCHAR(255) NOT NULL,
            customer_id VARCHAR(255),
            customer_name VARCHAR(255) NOT NULL,
            rating TINYINT NOT NULL,
            review_text TEXT,
            created_at BIGINT NOT NULL,
            INDEX idx_product_id (product_id)
          )
        `);

        await initSoloTenant();

        // Check if any products exist, if not seed some
        const prodCount = await dbGet('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', ['dishdash-solo']);
        if (prodCount && prodCount.count === 0) {
          console.log('[DB-Solo] Seeding initial products...');
          const initialProducts = [
            { name: "Noise Cancelling Headphones Pro", price: 24900, tag: "Tech", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80" },
            { name: "Minimalist Ceramic Coffee Mug", price: 2450, tag: "Home", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&auto=format&fit=crop&q=80" },
            { name: "Smart Home Assistant Hub", price: 12900, tag: "Tech", image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&auto=format&fit=crop&q=80" },
            { name: "Premium Leather Wallet", price: 6500, tag: "Lifestyle", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80" },
            { name: "Mechanical Keyboard RGB", price: 14900, tag: "Tech", image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80" },
            { name: "Stainless Steel Water Bottle", price: 3500, tag: "Lifestyle", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80" }
          ];

          const { v4: uuidv4 } = require('uuid');
          for (const p of initialProducts) {
            const id = uuidv4();
            await dbRun(
              'INSERT INTO products (id, tenant_id, name, price, images, data, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [id, 'dishdash-solo', p.name, p.price, JSON.stringify([p.image]), JSON.stringify({ is_trending: true, tag: p.tag }), null, Date.now(), Date.now()]
            );
          }
          console.log('[DB-Solo] Seeding complete.');
        }

        console.log('[DB-Solo] Database initialization successful.');
      } catch (err) {
        console.error('[DB-Solo] Error initializing database tables:', err);
        _dbReadyPromise = null; // Let it retry next time
        throw err;
      }
    })();
  }
  return _dbReadyPromise;
}

