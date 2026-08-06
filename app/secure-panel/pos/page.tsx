"use client"

import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Plus, Minus, CreditCard, Banknote, Landmark } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function AdminPOS() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{id: string, qty: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/products?tenantId=dishdash-solo')
      .then(r => r.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
      });
  }, []);

  const addToCart = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const stockVal = Number(product.data?.stock) || 0;

    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        if (existing.qty >= stockVal) {
          alert(`Cannot add more. Only ${stockVal} items available in stock.`);
          return prev;
        }
        return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      }
      if (stockVal <= 0) {
        alert('This product is out of stock.');
        return prev;
      }
      return [...prev, { id, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.qty > 1) {
        return prev.map(item => item.id === id ? { ...item, qty: item.qty - 1 } : item);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleCheckout = async (paymentType: 'cash' | 'card') => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const orderItems = cart.map(item => {
        const p = products.find(prod => prod.id === item.id);
        return {
          product_id: item.id,
          product_name: p?.name || 'Unknown',
          price: p?.price || 0,
          quantity: item.qty
        };
      });

      let custName = 'POS Walk-in Customer';
      let custPhone = 'POS-Store';

      if (selectedCustomerId !== 'walk-in') {
        const cust = customers.find(c => c.customer_id === selectedCustomerId);
        if (cust) {
          custName = cust.name;
          custPhone = cust.phone;
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'dishdash-solo',
          customer_name: custName,
          customer_phone: custPhone,
          payment_type: paymentType,
          items: orderItems,
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCart([]);
        setSelectedCustomerId('walk-in');
        
        // Wait a tiny bit for state to commit before blocking with alert
        setTimeout(() => alert(`POS Order placed successfully! Order ID: ${data.id}`), 10);
        
        // Reload products to get updated stock counts
        const r = await fetch('/api/products?tenantId=dishdash-solo');
        const updatedProds = await r.json();
        setProducts(updatedProds);
      } else {
        alert(data.error || 'Failed to complete checkout');
      }
    } catch (e) {
      alert('Error connecting to backend API');
    } finally {
      setSubmitting(false);
    }
  };

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.id);
    return total + (product?.price || 0) * item.qty;
  }, 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -transtone-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search products for POS..." 
              className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-stone-500">Loading products...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => {
                const images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
                const imageSrc = images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';
                const stockVal = Number(product.data?.stock) || 0;
                const isOutOfStock = stockVal <= 0;
                
                return (
                  <div 
                    key={product.id} 
                    onClick={() => addToCart(product.id)} 
                    className={`bg-stone-50 border border-stone-200 rounded-xl overflow-hidden cursor-pointer hover:border-stone-400 hover:shadow-md transition-all group ${isOutOfStock ? 'opacity-65 grayscale hover:border-stone-200 hover:shadow-none' : ''}`}
                  >
                    <div className="aspect-square bg-stone-100 overflow-hidden relative">
                      <img src={imageSrc} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                          <span className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{product.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <p className="font-black text-stone-900">{formatINR(product.price)}</p>
                        {!isOutOfStock && (
                          <span className="text-[10px] font-black text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-md">
                            Qty: {stockVal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* POS Cart Sidebar */}
      <div className="w-96 bg-white border border-stone-200 shadow-sm rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50">
          <h2 className="font-black text-stone-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Current Order
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <ShoppingBag className="w-12 h-12 mb-2 opacity-50" />
              <p>No items in cart</p>
            </div>
          ) : (
            cart.map(item => {
              const product = products.find(p => p.id === item.id);
              if (!product) return null;
              return (
                <div key={item.id} className="flex justify-between items-center bg-stone-50 border border-stone-100 p-3 rounded-xl">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{product.name}</h4>
                    <p className="text-stone-500 font-medium text-xs">{formatINR(product.price)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-2 py-1">
                    <button onClick={() => removeFromCart(item.id)} className="text-stone-400 hover:text-stone-900"><Minus className="w-3 h-3" /></button>
                    <span className="font-bold text-sm text-stone-900 w-4 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item.id)} className="text-stone-400 hover:text-stone-900"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Assign to Customer</label>
            <select 
              value={selectedCustomerId} 
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-900 font-semibold"
            >
              <option value="walk-in">POS Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between items-center text-lg pt-1">
            <span className="font-bold text-stone-500">Total</span>
            <span className="font-black text-2xl text-stone-900">{formatINR(cartTotal)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleCheckout('cash')}
              disabled={cart.length === 0 || submitting}
              className="bg-stone-900 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer text-xs"
            >
              <Banknote className="w-5 h-5" /> Cash
            </button>
            <button 
              onClick={() => handleCheckout('card')}
              disabled={cart.length === 0 || submitting}
              className="bg-stone-200 text-stone-900 font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-stone-300 transition-colors disabled:opacity-50 cursor-pointer text-xs"
            >
              <CreditCard className="w-5 h-5" /> Card / UPI
            </button>
            {selectedCustomerId !== 'walk-in' ? (
              <button 
                onClick={() => handleCheckout('khata' as any)}
                disabled={cart.length === 0 || submitting}
                className="bg-amber-100 text-amber-800 border border-amber-200 font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-amber-200 transition-colors disabled:opacity-50 cursor-pointer text-[11px]"
              >
                <Landmark className="w-5 h-5" /> Bill Khata
              </button>
            ) : (
              <button 
                disabled
                className="bg-stone-100 text-stone-400 font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed text-[11px]"
                title="Select a registered customer to bill to Khata"
              >
                <Landmark className="w-5 h-5" /> Bill Khata
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
