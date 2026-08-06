import { dbAll, dbGet, dbRun, initSoloTenant } from './db';
import { v4 as uuidv4 } from 'uuid';

export const TENANT_ID = 'dishdash-solo';

// Ensure tenant is initialized when API is loaded
initSoloTenant().catch(console.error);

export const SoloAPI = {
  // Products
  async getProducts() {
    const products = await dbAll('SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC', [TENANT_ID]);
    return products.map(p => ({ ...p, data: typeof p.data === 'string' ? JSON.parse(p.data) : p.data }));
  },

  async getTrendingProducts() {
    const products = await this.getProducts();
    return products.filter(p => p.data?.is_trending === true);
  },
  
  async getProduct(id: string) {
    return await dbGet('SELECT * FROM products WHERE tenant_id = ? AND id = ?', [TENANT_ID, id]);
  },
  
  async createProduct(data: { name: string, price: number, category_id?: string, images?: string, data?: string }) {
    const id = uuidv4();
    await dbRun(
      'INSERT INTO products (id, tenant_id, name, price, images, data, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, TENANT_ID, data.name, data.price, data.images || '[]', data.data || '{}', data.category_id || null, Date.now(), Date.now()]
    );
    return id;
  },
  
  async updateProduct(id: string, data: { name: string, price: number }) {
    await dbRun(
      'UPDATE products SET name = ?, price = ?, updated_at = ? WHERE tenant_id = ? AND id = ?',
      [data.name, data.price, Date.now(), TENANT_ID, id]
    );
  },

  // Categories
  async getCategories() {
    return await dbAll('SELECT * FROM categories WHERE tenant_id = ? ORDER BY sort_order ASC', [TENANT_ID]);
  },

  // Customers & Store Credit
  async getCustomers() {
    return await dbAll(`
      SELECT c.*, sc.khata_limit as store_credit, sc.khata_status 
      FROM customers c 
      LEFT JOIN store_customers sc ON c.id = sc.customer_id AND sc.tenant_id = ?
      WHERE c.tenant_id = ?
    `, [TENANT_ID, TENANT_ID]);
  },
  
  async registerCustomer(data: { name: string, phone: string, email?: string, password: string }) {
    const existing = await dbGet('SELECT id FROM customers WHERE tenant_id = ? AND phone = ?', [TENANT_ID, data.phone]);
    if (existing) throw new Error('Customer with this phone number already exists.');
    
    const id = uuidv4();
    // Insert into customers
    await dbRun(
      'INSERT INTO customers (id, tenant_id, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, TENANT_ID, data.name, data.phone, data.password, Date.now()]
    );
    
    // Automatically initialize store credit ledger
    await dbRun(
      'INSERT INTO store_customers (id, tenant_id, customer_id, khata_status, khata_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), TENANT_ID, id, 'active', 0, Date.now(), Date.now()]
    );
    return id;
  },
  
  async loginCustomer(phone: string, password: string) {
    const customer = await dbGet('SELECT id, name, phone, password FROM customers WHERE tenant_id = ? AND phone = ?', [TENANT_ID, phone]);
    if (!customer) throw new Error('Customer not found');
    if (customer.password !== password) throw new Error('Invalid credentials');
    
    // In production, you would issue a JWT here.
    return { id: customer.id, name: customer.name, phone: customer.phone };
  },

  async updateStoreCredit(customerId: string, amount: number) {
    // Check if store_customers entry exists
    const existing = await dbGet('SELECT id FROM store_customers WHERE tenant_id = ? AND customer_id = ?', [TENANT_ID, customerId]);
    if (existing) {
      await dbRun('UPDATE store_customers SET khata_limit = ?, updated_at = ? WHERE id = ?', [amount, Date.now(), existing.id]);
    } else {
      await dbRun(
        'INSERT INTO store_customers (id, tenant_id, customer_id, khata_status, khata_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), TENANT_ID, customerId, 'active', amount, Date.now(), Date.now()]
      );
    }
  },

  // Orders
  async getOrders() {
    return await dbAll('SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC', [TENANT_ID]);
  },
  
  async createOrder(data: { customer_name: string, customer_phone?: string, total_amount: number, payment_type: string, is_paid: boolean, items: any[] }) {
    const orderId = uuidv4();
    await dbRun(
      'INSERT INTO orders (id, tenant_id, customer_name, customer_phone, payment_type, is_paid, status, total_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, TENANT_ID, data.customer_name, data.customer_phone || '', data.payment_type, data.is_paid ? 1 : 0, 'placed', data.total_amount, Date.now(), Date.now()]
    );
    
    for (const item of data.items) {
      await dbRun(
        'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), orderId, item.id, item.name, item.quantity, item.price]
      );
    }
    return orderId;
  }
};
