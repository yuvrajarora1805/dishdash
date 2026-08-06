const mysql = require('mysql2/promise');

async function fix() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'storex',
    password: 'storex_password',
    database: 'storex'
  });
  
  // Find all khata_entries with description 'Store Purchase' and type 'debit'
  const [rows] = await connection.execute("SELECT * FROM khata_entries WHERE description = 'Store Purchase' AND type = 'debit'");
  console.log(`Found ${rows.length} buggy Store Purchase entries.`);
  
  // Fix them to 'credit'
  const [result] = await connection.execute("UPDATE khata_entries SET type = 'credit' WHERE description = 'Store Purchase' AND type = 'debit'");
  console.log(`Fixed ${result.affectedRows} entries.`);
  
  // Also fix 'Payment Received' from 'credit' to 'debit' if any were wrong?
  // Wait, my previous code in /app/admin/khata/page.tsx had 'debit' for Payment Received. So that is correct.

  // Let's print out all balances
  const [customers] = await connection.execute(`
    SELECT sc.id, c.name, c.phone, 
      COALESCE((SELECT SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) FROM khata_entries WHERE customer_id = c.id AND tenant_id = sc.tenant_id), 0) as credit_balance
    FROM store_customers sc
    JOIN customers c ON sc.customer_id = c.id
  `);
  console.log("Current Balances:", customers);

  await connection.end();
}

fix().catch(console.error);
