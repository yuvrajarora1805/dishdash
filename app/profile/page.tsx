"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, User, Phone, Mail, MapPin, Package, Clock } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  // Structured Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      setName(data.customer.name || '');
      setEmail(data.customer.email || '');
      setPhone(data.customer.phone || '');
      setOrders(data.orders || []);

      // Parse structured address JSON
      let parsedAddr = { street: '', city: '', state: '', pin: '' };
      if (data.customer.address) {
        try {
          parsedAddr = JSON.parse(data.customer.address);
        } catch (e) {
          // Fallback if legacy address was saved as a plain string
          parsedAddr.street = data.customer.address;
        }
      }
      setStreet(parsedAddr.street || '');
      setCity(parsedAddr.city || '');
      setStateName(parsedAddr.state || '');
      setPin(parsedAddr.pin || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const fullAddressJSON = JSON.stringify({ street, city, state: stateName, pin });
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address: fullAddressJSON })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update details');
      }

      setSuccess('Profile updated successfully!');
      // Update local storage payload so storefront header and checkout sync immediately
      localStorage.setItem('dishdash_customer', JSON.stringify(data.customer));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-stone-900" />
          <p className="font-bold text-sm">Loading your profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-700 py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <a href="/" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors font-bold text-xs mb-1">
              <ArrowLeft className="w-4 h-4" /> Back to Store
            </a>
            <h1 className="text-4xl font-black text-stone-900 leading-tight">My Profile</h1>
            <p className="text-xs text-stone-400">Manage account information and trace storefront order dispatch status.</p>
          </div>
          <div className="font-bold text-2xl tracking-tight text-stone-900 flex items-center gap-2 select-none self-start sm:self-center">
            <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Dish<span className="text-stone-500 font-normal">Dash</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 text-xs font-bold text-red-650 bg-red-50 border border-red-200 rounded-2xl">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 text-xs font-bold text-emerald-650 bg-emerald-50 border border-emerald-200 rounded-2xl">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Profile Editing */}
          <form onSubmit={handleUpdate} className="lg:col-span-5 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
              <User className="w-5 h-5 text-stone-500" /> Account Information
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-850 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-850 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-850 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              {/* Structured Address Section */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h3 className="text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-stone-400" /> Delivery Address
                </h3>
                
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-stone-400">Flat / Street / Area</label>
                  <input
                    required
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Flat 302, Building A, Main Road"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-850 text-sm font-semibold transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-stone-400">City</label>
                    <input
                      required
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-850 text-sm font-semibold transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-stone-400">State</label>
                    <input
                      required
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Delhi"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-850 text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-stone-400">PIN / Postal Code</label>
                  <input
                    required
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-850 text-sm font-semibold transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={updating}
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
            </button>
          </form>

          {/* Right Side: Order History */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-stone-500" /> Past Orders
            </h2>

            {orders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-semibold text-sm">No orders found.</p>
                <p className="text-xs text-stone-450 mt-0.5">Your purchases will be documented here once placed.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {orders.map((order) => {
                  const dateStr = new Date(Number(order.created_at)).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div key={order.id} className="border border-stone-200 rounded-2xl p-4 space-y-3 hover:border-stone-300 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">ORDER ID: {order.id.slice(0, 8)}...</span>
                          <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Placed on {dateStr}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            order.status === 'delivered' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}>
                            {order.status}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            order.payment_status === 'paid' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>

                      {/* Ordered Items list */}
                      {order.items && order.items.length > 0 && (
                        <div className="py-2.5 border-t border-b border-stone-100 space-y-1.5 bg-stone-50/50 rounded-xl px-3 my-2">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-xs font-semibold text-stone-600">
                              <span>
                                {item.product_name} <span className="text-[10px] font-bold text-stone-400">x{item.quantity}</span>
                              </span>
                              <span className="text-stone-900 font-bold">{formatINR(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <div className="text-xs text-stone-400 font-semibold uppercase">Payment: {order.payment_type}</div>
                        <div className="font-black text-stone-900 text-lg">{formatINR(order.total_amount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
