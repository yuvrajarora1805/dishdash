"use client";

import { useState, useEffect } from 'react';
import { Search, FileText, Loader2, X, PlusCircle, Landmark, CheckCircle } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function AdminKhata() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Ledger Drawer State
  const [ledgerCustomer, setLedgerCustomer] = useState<any | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState('');

  // New Ledger Entry Form State
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDesc, setEntryDesc] = useState('Payment Received');
  const [savingEntry, setSavingEntry] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter ONLY customers who owe money (balance > 0)
        setCustomers(data.filter(c => (Number(c.credit_balance) || 0) > 0));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLedger = async (customer: any) => {
    setLedgerCustomer(customer);
    setLoadingLedger(true);
    setLedgerError('');
    setEntryAmount(String(customer.credit_balance)); // Auto-fill with pending amount
    setEntryDesc('Payment Received');

    try {
      const res = await fetch(`/api/admin/ledger?customerId=${customer.customer_id}`);
      const data = await res.json();
      if (res.ok) {
        setLedgerEntries(data);
      } else {
        throw new Error(data.error || 'Failed to load ledger');
      }
    } catch (err: any) {
      setLedgerError(err.message);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleAddLedgerEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerCustomer || !entryAmount) return;
    setSavingEntry(true);
    setLedgerError('');

    try {
      const res = await fetch('/api/admin/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: ledgerCustomer.customer_id,
          type: 'debit', // 'debit' in DB means Payment Received (credits the balance negatively)
          amount: Number(entryAmount),
          description: entryDesc
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save entry');
      }

      // If fully settled, close drawer. Otherwise refresh.
      if (Number(entryAmount) >= Number(ledgerCustomer.credit_balance)) {
        setLedgerCustomer(null);
      } else {
        handleOpenLedger(ledgerCustomer);
      }
      fetchCustomers();
    } catch (err: any) {
      setLedgerError(err.message);
    } finally {
      setSavingEntry(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPending = filteredCustomers.reduce((acc, c) => acc + (Number(c.credit_balance) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-1">Pending Khata Payments</h1>
          <p className="text-stone-500">Track and settle outstanding store credit balances.</p>
        </div>
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider opacity-70">Total Pending:</span>
            <span className="font-black text-xl">{formatINR(totalPending)}</span>
        </div>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 transition-colors"
            />
          </div>
          <div className="text-sm font-bold text-stone-500">{filteredCustomers.length} Pending Accounts</div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-900" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500 font-bold">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-right">Khata Balance</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500">No pending payments found. All clear! 🎉</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer: any) => {
                    const balance = Number(customer.credit_balance) || 0;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-stone-900">{customer.name}</div>
                        </td>
                        <td className="p-4 text-sm text-stone-600 font-medium">{customer.phone}</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black bg-red-50 text-red-700 border border-red-200">
                            {formatINR(balance)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleOpenLedger(customer)}
                            className="bg-stone-900 text-white hover:bg-stone-800 font-bold text-xs py-2 px-4 rounded-lg transition-colors flex items-center gap-1 justify-end ml-auto cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" /> Settle
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── DRAWER: SETTLE PAYMENT ── */}
      {ledgerCustomer && (
        <>
          <div onClick={() => setLedgerCustomer(null)} className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40" />
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-stone-200 z-50 flex flex-col">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h2 className="text-xl font-black text-stone-900">Settle Khata Payment</h2>
                <p className="text-xs text-stone-500 font-bold">{ledgerCustomer.name} • {ledgerCustomer.phone}</p>
              </div>
              <button onClick={() => setLedgerCustomer(null)} className="text-stone-450 hover:text-stone-900 p-1"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Settle Form */}
              <form onSubmit={handleAddLedgerEntry} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5"><Landmark className="w-4 h-4" /> Record Payment</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <input 
                      required 
                      type="number" 
                      placeholder="Amount" 
                      value={entryAmount} 
                      onChange={e => setEntryAmount(e.target.value)} 
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-600 font-semibold" 
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text" 
                      placeholder="Memo/Description" 
                      value={entryDesc} 
                      onChange={e => setEntryDesc(e.target.value)} 
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-600 font-semibold" 
                    />
                  </div>
                </div>

                <button disabled={savingEntry} type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow flex items-center justify-center gap-1.5 cursor-pointer">
                  {savingEntry ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Save Payment</>}
                </button>
              </form>

              {/* Transactions List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Statement Entries</h3>
                
                {loadingLedger ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-stone-900" /></div>
                ) : ledgerError ? (
                  <div className="p-3 text-xs text-red-650 bg-red-50 rounded-xl">{ledgerError}</div>
                ) : ledgerEntries.length === 0 ? (
                  <p className="text-stone-400 text-xs font-semibold text-center py-10 select-none">No transactions recorded.</p>
                ) : (
                  <div className="space-y-2.5">
                    {ledgerEntries.map((entry) => {
                      const isDebit = entry.type === 'credit'; 
                      const entryDate = new Date(Number(entry.created_at)).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      });

                      return (
                        <div key={entry.id} className="border border-stone-150 rounded-xl p-3 flex justify-between items-center bg-white">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-stone-850 block">{entry.description || (isDebit ? 'Purchase' : 'Payment Received')}</span>
                            <span className="text-[10px] text-stone-400 block font-medium">{entryDate}</span>
                          </div>
                          <span className={`text-sm font-black ${isDebit ? 'text-red-650' : 'text-emerald-650'}`}>
                            {isDebit ? '-' : '+'}{formatINR(entry.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
