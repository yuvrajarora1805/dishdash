import { Users, DollarSign, Package, ShoppingBag } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { SalesChart, CreditLedger } from '@/components/admin/DashboardCharts';
import { dbGet, dbAll } from '@/lib/db';
import { connection } from 'next/server';

export default async function AdminDashboard() {
  await connection();
  const tenantId = 'dishdash-solo';
  
  // Fetch dynamic stats
  const orderStats = await dbGet(`
    SELECT 
      COUNT(*) as total_orders, 
      COALESCE(SUM(total_amount), 0) as total_revenue
    FROM orders 
    WHERE tenant_id = ? AND status != 'cancelled'
  `, [tenantId]) || { total_orders: 0, total_revenue: 0 };

  const customerStats = await dbGet(`
    SELECT COUNT(*) as total_customers 
    FROM store_customers 
    WHERE tenant_id = ?
  `, [tenantId]) || { total_customers: 0 };

  const productStats = await dbGet(`
    SELECT COUNT(*) as total_products 
    FROM products 
    WHERE tenant_id = ?
  `, [tenantId]) || { total_products: 0 };

  const stats = [
    { name: 'Total Revenue', value: formatINR(Number(orderStats.total_revenue) || 0), icon: DollarSign, change: 'Dynamic' },
    { name: 'Total Orders', value: String(orderStats.total_orders || 0), icon: ShoppingBag, change: 'Dynamic' },
    { name: 'Active Customers', value: String(customerStats.total_customers || 0), icon: Users, change: 'Dynamic' },
    { name: 'Products', value: String(productStats.total_products || 0), icon: Package, change: 'Dynamic' },
  ];

  // Fetch dynamic sales data (grouped by date)
  const salesDataRaw = await dbAll(`
    SELECT DATE(FROM_UNIXTIME(created_at/1000)) as date, SUM(total_amount) as sales
    FROM orders
    WHERE tenant_id = ? AND status != 'cancelled'
    GROUP BY date
    ORDER BY date DESC
    LIMIT 7
  `, [tenantId]);

  const salesData = salesDataRaw.reverse().map((row: any) => ({
    name: new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }),
    sales: Number(row.sales) || 0
  }));

  // Fetch dynamic ledger data (last 5 khata entries)
  const ledgerDataRaw = await dbAll(`
    SELECT k.id, k.type as action, k.amount, k.created_at as date, c.name as user
    FROM khata_entries k
    JOIN customers c ON k.customer_id = c.id
    WHERE k.tenant_id = ?
    ORDER BY k.created_at DESC
    LIMIT 5
  `, [tenantId]);

  const ledgerData = ledgerDataRaw.map((row: any) => ({
    id: row.id,
    user: row.user,
    action: row.action === 'credit' ? 'Added' : 'Used',
    amount: row.action === 'credit' ? Number(row.amount) : -Number(row.amount),
    date: new Date(row.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }));

  // Fetch Payment Method Breakdown
  const paymentStatsRaw = await dbAll(`
    SELECT payment_type, SUM(total_amount) as amount 
    FROM orders 
    WHERE tenant_id = ? AND status != 'cancelled' 
    GROUP BY payment_type
  `, [tenantId]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Dashboard Overview</h1>
        <p className="text-stone-500">Welcome to your standalone DishDash store control panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white border border-stone-200 shadow-sm p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-900">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-stone-500'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-stone-500 text-sm font-medium">{stat.name}</h3>
            <p className="text-2xl font-black text-stone-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6 h-96">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Recent Sales</h2>
          <div className="flex items-center justify-center h-[270px]">
            <SalesChart data={salesData} />
          </div>
        </div>
        <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6 h-96">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Store Credit Ledger Activity</h2>
          <div className="flex items-start h-[270px]">
            <CreditLedger data={ledgerData} />
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Revenue by Payment Method</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {paymentStatsRaw.length === 0 ? (
            <div className="text-stone-500 text-sm">No payment data available.</div>
          ) : (
            paymentStatsRaw.map((stat: any) => (
              <div key={stat.payment_type} className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex flex-col justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-stone-500 mb-2">{stat.payment_type}</span>
                <span className="text-xl font-black text-stone-900">{formatINR(Number(stat.amount))}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
