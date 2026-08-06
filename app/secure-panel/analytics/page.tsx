import { BarChart3, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { SalesChart } from '@/components/admin/DashboardCharts';
import { formatINR } from '@/lib/utils';
import { dbGet, dbAll } from '@/lib/db';
import { connection } from 'next/server';

export default async function AnalyticsPage() {
  await connection();
  const tenantId = 'dishdash-solo';

  // 1. Total Revenue
  const revRaw = await dbGet(`
    SELECT COALESCE(SUM(total_amount), 0) as total_revenue
    FROM orders
    WHERE tenant_id = ? AND status != 'cancelled'
  `, [tenantId]);
  const totalRevenue = Number(revRaw?.total_revenue) || 0;

  // 2. Average Order Value
  const aovRaw = await dbGet(`
    SELECT COALESCE(AVG(total_amount), 0) as avg_order_value
    FROM orders
    WHERE tenant_id = ? AND status != 'cancelled'
  `, [tenantId]);
  const avgOrderValue = Number(aovRaw?.avg_order_value) || 0;

  // 3. Active Customers
  const custRaw = await dbGet(`
    SELECT COUNT(*) as total_customers 
    FROM store_customers 
    WHERE tenant_id = ?
  `, [tenantId]);
  const totalCustomers = custRaw?.total_customers || 0;

  // 4. Total Orders
  const ordersRaw = await dbGet(`
    SELECT COUNT(*) as total_orders
    FROM orders
    WHERE tenant_id = ? AND status != 'cancelled'
  `, [tenantId]);
  const totalOrders = ordersRaw?.total_orders || 0;

  const metrics = [
    { label: 'Total Revenue', value: formatINR(totalRevenue), trend: '+12.5%', icon: TrendingUp },
    { label: 'Average Order Value', value: formatINR(avgOrderValue), trend: '+5.2%', icon: ShoppingBag },
    { label: 'Active Customers', value: String(totalCustomers), trend: '+18.1%', icon: Users },
    { label: 'Total Orders', value: String(totalOrders), trend: '+2.4%', icon: BarChart3 },
  ];

  // 5. Fetch dynamic sales data (grouped by date)
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

  // 6. Fetch Top Products
  const topProductsRaw = await dbAll(`
    SELECT product_name as name, SUM(quantity) as sales, SUM(price * quantity) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.tenant_id = ? AND o.status != 'cancelled'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY sales DESC
    LIMIT 5
  `, [tenantId]);

  const topProducts = topProductsRaw.map((p: any) => ({
    name: p.name,
    sales: Number(p.sales) || 0,
    revenue: Number(p.revenue) || 0
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Analytics</h1>
        <p className="text-stone-500">Deep dive into your store's performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white border border-stone-200 shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-900">
                <metric.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-bold ${metric.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {metric.trend}
              </span>
            </div>
            <p className="text-stone-500 text-sm font-medium mb-1">{metric.label}</p>
            <p className="text-2xl font-black text-stone-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-stone-200 shadow-sm rounded-xl p-6 h-[400px]">
          <h2 className="text-xl font-bold text-stone-900 mb-6">Revenue Over Time</h2>
          <div className="h-[300px] flex items-center justify-center">
             <SalesChart data={salesData} />
          </div>
        </div>

        <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6">
          <h2 className="text-xl font-bold text-stone-900 mb-6">Top Products</h2>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="text-center py-10 text-stone-500 text-sm">No sales data recorded yet.</div>
            ) : (
              topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
                  <div>
                    <p className="font-bold text-stone-900 text-sm">{product.name}</p>
                    <p className="text-stone-500 text-xs font-medium">{product.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-stone-900 text-sm">{formatINR(product.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
