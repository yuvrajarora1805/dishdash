"use client"

import { useState, useEffect } from 'react';
import { formatINR } from '@/lib/utils';
import { Search, ShoppingBag, Eye, X, Loader2, Calendar, Phone, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer / Details State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Dropdown States in Drawer
  const [statusVal, setStatusVal] = useState('');
  const [paymentStatusVal, setPaymentStatusVal] = useState('');
  const [remarksVal, setRemarksVal] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    setLoadingDetails(true);
    setStatusVal(order.status);
    setPaymentStatusVal(order.payment_status);
    setRemarksVal(order.remarks || '');
    
    try {
      const res = await fetch(`/api/orders?id=${order.id}`);
      const data = await res.json();
      if (res.ok) {
        setOrderDetails(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: statusVal,
          payment_status: paymentStatusVal,
          remarks: remarksVal
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.payment_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-1">Orders</h1>
          <p className="text-stone-500">View and manage all customer orders.</p>
        </div>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -transtone-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search by order ID or customer..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 transition-colors"
            />
          </div>
          <div className="text-sm font-bold text-stone-500">{filteredOrders.length} Orders</div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500 font-bold">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-500">No orders found.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => {
                    const date = new Date(order.created_at).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    });
                    
                    return (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-mono text-xs font-bold text-stone-700 bg-stone-100 border border-stone-200 px-2 py-1 rounded inline-block">
                            #{order.id.slice(0,8).toUpperCase()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-stone-900">{order.customer_name}</div>
                          <div className="text-xs text-stone-500">{order.customer_phone}</div>
                        </td>
                        <td className="p-4 text-xs text-stone-600 font-medium">{date}</td>
                        <td className="p-4 text-xs text-stone-600 font-bold uppercase">{order.payment_type}</td>
                        <td className="p-4 font-black text-stone-900">{formatINR(order.total_amount)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${order.payment_status === 'paid' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.payment_status === 'failed' ? 'text-red-700 bg-red-100 border-red-200' : 'text-amber-700 bg-amber-100 border-amber-200'}`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${order.status === 'delivered' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' : 'text-blue-700 bg-blue-100 border-blue-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleViewOrder(order)}
                            className="text-stone-400 hover:text-stone-900 font-semibold text-sm transition-colors flex items-center gap-1 justify-end w-full cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> View
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

      {/* Order Details Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-stone-200 z-50 flex flex-col"
            >
              <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div>
                  <h2 className="text-xl font-black text-stone-900">Order Details</h2>
                  <p className="text-xs text-stone-500 font-mono">#{selectedOrder.id.toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500 hover:text-stone-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Customer Details */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Customer Info</h3>
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <User className="w-4 h-4 text-stone-400" />
                    <span className="text-sm font-semibold">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <span className="text-sm font-semibold">{selectedOrder.customer_phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-700">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    <span className="text-sm font-semibold">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Items Purchase List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Items ordered</h3>
                  {loadingDetails ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-stone-900" /></div>
                  ) : orderDetails?.items?.length > 0 ? (
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-4 bg-white space-y-3">
                      {orderDetails.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm pt-3 first:pt-0">
                          <div>
                            <div className="font-bold text-stone-900">{item.product_name}</div>
                            <div className="text-xs text-stone-500">Qty: {item.quantity} × {formatINR(item.price)}</div>
                          </div>
                          <div className="font-bold text-stone-900">{formatINR(item.price * item.quantity)}</div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t border-stone-200 font-bold text-stone-900 text-lg">
                        <span>Total Paid</span>
                        <span>{formatINR(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-stone-500 text-sm">No items found.</p>
                  )}
                </div>

                {/* Status Controls */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Order Management</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase">Order Status</label>
                    <select 
                      value={statusVal} 
                      onChange={e => setStatusVal(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 outline-none focus:border-stone-900 transition-colors"
                    >
                      <option value="placed">Placed</option>
                      <option value="preparing">Preparing</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase">Payment Status</label>
                    <select 
                      value={paymentStatusVal} 
                      onChange={e => setPaymentStatusVal(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 outline-none focus:border-stone-900 transition-colors"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Admin Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase">Admin Remarks / Notes</label>
                    <textarea 
                      value={remarksVal} 
                      onChange={e => setRemarksVal(e.target.value)}
                      placeholder="Add delivery updates, tracking notes, or custom remarks..."
                      rows={3}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-stone-200 bg-stone-50">
                <button 
                  disabled={updating}
                  onClick={handleUpdateStatus}
                  className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Modifications'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
