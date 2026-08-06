"use client";

import { useState, useEffect } from 'react';
import { Search, UserPlus, FileText, Loader2, X, PlusCircle, ArrowLeft, Landmark } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Customer Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLimit, setNewLimit] = useState('15000');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addError, setAddError] = useState('');

  // Ledger Drawer State
  const [ledgerCustomer, setLedgerCustomer] = useState<any | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState('');

  // New Ledger Entry Form State
  const [entryType, setEntryType] = useState<'credit' | 'debit'>('credit');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
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
        setCustomers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCustomer(true);
    setAddError('');

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail,
          khata_limit: Number(newLimit)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add customer');
      }

      // Reset fields & reload list
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewLimit('15000');
      setAddModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddingCustomer(false);
    }
  };

  const handleOpenLedger = async (customer: any) => {
    setLedgerCustomer(customer);
    setLoadingLedger(true);
    setLedgerError('');
    setEntryAmount('');
    setEntryDesc('');

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
          type: entryType,
          amount: Number(entryAmount),
          description: entryDesc
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save entry');
      }

      // Re-fetch ledger entries and update customer lists
      handleOpenLedger(ledgerCustomer);
      fetchCustomers();
    } catch (err: any) {
      setLedgerError(err.message);
    } finally {
      setSavingEntry(false);
    }
  };

  const handleUpdateLimit = async (customer: any) => {
    const newLimit = window.prompt(`Enter new Khata credit limit for ${customer.name} (in INR):`, customer.khata_limit);
    if (newLimit === null) return;
    
    const limitNum = Number(newLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      alert('Invalid limit amount.');
      return;
    }

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.customer_id, khata_limit: limitNum })
      });
      if (res.ok) {
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update credit limit.');
      }
    } catch (e) {
      alert('Network error while updating limit.');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-1">Customers & Credit Ledger</h1>
          <p className="text-stone-500">Manage Khata (store credit) accounts, statements, and manual overrides.</p>
        </div>
        <button 
          onClick={() => setAddModalOpen(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          <UserPlus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search customers by name or phone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 transition-colors"
            />
          </div>
          <div className="text-sm font-bold text-stone-500">{filteredCustomers.length} Accounts</div>
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
                  <th className="p-4">Email</th>
                  <th className="p-4">Khata Balance</th>
                  <th className="p-4">Limit</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-500">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer: any) => {
                    const balance = Number(customer.credit_balance) || 0;
                    const limit = Number(customer.khata_limit) || 0;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-stone-900">{customer.name}</div>
                        </td>
                        <td className="p-4 text-sm text-stone-600 font-medium">{customer.phone}</td>
                        <td className="p-4 text-sm text-stone-500">{customer.email || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black ${
                            balance > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}>
                            {formatINR(balance)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-stone-500 font-semibold">
                          <button onClick={() => handleUpdateLimit(customer)} className="hover:text-stone-900 border-b border-dashed border-stone-300 hover:border-stone-900 transition-colors pb-0.5 cursor-pointer">
                            {formatINR(limit)}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleOpenLedger(customer)}
                            className="bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 justify-end ml-auto cursor-pointer"
                          >
                            <FileText className="w-4 h-4" /> Ledger
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

      {/* ── MODAL: ADD CUSTOMER ── */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomer} className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-900">Add Customer Manually</h2>
              <button type="button" onClick={() => setAddModalOpen(false)} className="text-stone-450 hover:text-stone-900"><X className="w-5 h-5" /></button>
            </div>

            {addError && <div className="p-3 text-xs font-bold text-red-650 bg-red-50 rounded-xl">{addError}</div>}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400">Full Name</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Rahul Kumar" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-stone-900 focus:bg-white transition-all font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400">Phone Number</label>
                <input required type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-stone-900 focus:bg-white transition-all font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400">Email Address (Optional)</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. rahul@kumar.com" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-stone-900 focus:bg-white transition-all font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400">Khata Credit Limit (INR)</label>
                <input required type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-stone-900 focus:bg-white transition-all font-semibold" />
              </div>
            </div>

            <button disabled={addingCustomer} type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {addingCustomer ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {/* ── DRAWER: LEDGER TRANSACTIONS ── */}
      {ledgerCustomer && (
        <>
          <div onClick={() => setLedgerCustomer(null)} className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40" />
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-stone-200 z-50 flex flex-col">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h2 className="text-xl font-black text-stone-900">Store Credit Ledger</h2>
                <p className="text-xs text-stone-500 font-bold">{ledgerCustomer.name} • {ledgerCustomer.phone}</p>
              </div>
              <button onClick={() => setLedgerCustomer(null)} className="text-stone-450 hover:text-stone-900 p-1"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Ledger Form */}
              <form onSubmit={handleAddLedgerEntry} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5"><Landmark className="w-4 h-4 text-stone-400" /> Post New Transaction</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setEntryType('credit')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${entryType === 'credit' ? 'bg-red-50 text-red-700 border-red-300 shadow-sm' : 'bg-white text-stone-500 border-stone-200'}`}
                  >
                    Debit Purchase (-)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEntryType('debit')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${entryType === 'debit' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-white text-stone-500 border-stone-200'}`}
                  >
                    Credit Payment (+)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <input 
                      required 
                      type="number" 
                      placeholder="Amount" 
                      value={entryAmount} 
                      onChange={e => setEntryAmount(e.target.value)} 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-stone-900 font-semibold" 
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text" 
                      placeholder="Memo/Description" 
                      value={entryDesc} 
                      onChange={e => setEntryDesc(e.target.value)} 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-stone-900 font-semibold" 
                    />
                  </div>
                </div>

                <button disabled={savingEntry} type="submit" className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition-colors shadow flex items-center justify-center gap-1.5 cursor-pointer">
                  {savingEntry ? <Loader2 className="w-4 h-4 animate-spin" /> : <><PlusCircle className="w-4 h-4" /> Save Ledger Entry</>}
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
                  <p className="text-stone-400 text-xs font-semibold text-center py-10 select-none">No transactions recorded on this ledger statement.</p>
                ) : (
                  <div className="space-y-2.5">
                    {ledgerEntries.map((entry) => {
                      const isDebit = entry.type === 'credit'; // In Pos/Khata schema, 'credit' type represents user using credit (debit to balance), 'debit' type represents payment (credit to balance)
                      const entryDate = new Date(Number(entry.created_at)).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      });

                      return (
                        <div key={entry.id} className="border border-stone-150 rounded-xl p-3 flex justify-between items-center bg-white hover:bg-stone-50/50 transition-colors">
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
