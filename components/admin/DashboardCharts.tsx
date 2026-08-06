"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SalesChart({ data }: { data: { name: string, sales: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-stone-500 text-sm">No sales data available</div>;
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
          <Tooltip
            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="sales" fill="#0f172a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CreditLedger({ data }: { data: { id: string, user: string, action: string, amount: number, date: string }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-stone-500 text-sm">No recent transactions</div>;
  }

  return (
    <div className="h-[250px] w-full overflow-auto pr-2">
      <div className="space-y-4">
        {data.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between border-b border-stone-200 pb-3 last:border-0 last:pb-0">
            <div className="flex flex-col">
              <span className="text-stone-900 font-bold text-sm">{tx.user}</span>
              <span className="text-stone-500 text-xs">{tx.date}</span>
            </div>
            <div className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
