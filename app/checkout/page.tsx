"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Loader2, Phone, User, MapPin, ShieldCheck, Package, Truck, Lock, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react'
import { formatINR } from '@/lib/utils'

const COLOR_OPTIONS = [
  { name: 'Standard', hex: '#78716c', priceMultiplier: 1.0 },
  { name: 'Silver Metal', hex: '#cbd5e1', priceMultiplier: 1.0 },
  { name: 'Midnight Spark', hex: '#1e293b', priceMultiplier: 1.1 },
  { name: 'Rose Gold', hex: '#fda4af', priceMultiplier: 1.05 }
];

const STEPS = ['Cart', 'Details', 'Payment']

export default function CheckoutPage() {
  const [cart, setCart] = useState<{id: string, qty: number, color: string}[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [step] = useState(1) // 0=Cart, 1=Details, 2=Payment

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  
  // Structured Address fields
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [pin, setPin] = useState('')

  const [paymentMethod] = useState<'razorpay'>('razorpay')

  useEffect(() => {
    // Dynamically inject Razorpay Checkout Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    const searchParams = new URLSearchParams(window.location.search)
    const sId = searchParams.get('successId')
    const err = searchParams.get('error')
    if (sId) {
      setSuccessId(sId)
      localStorage.removeItem('dishdash_cart')
    }
    if (err === 'payment_failed') {
      setPaymentError('Your payment was not completed. Please try again — your cart has been saved.')
    } else if (err) {
      setPaymentError('Something went wrong during payment. Please try again.')
    }
    // Clear error/success params from URL so refresh doesn't re-trigger
    if (err || sId) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // Pre-fill customer details & address if logged in
    const savedCustomer = localStorage.getItem('dishdash_customer');
    if (savedCustomer) {
      try {
        const cust = JSON.parse(savedCustomer);
        setName(cust.name);
        setPhone(cust.phone);
        let parsedAddr = { street: '', city: '', state: '', pin: '' };
        if (cust.address) {
          try { parsedAddr = JSON.parse(cust.address); }
          catch (e) { parsedAddr.street = cust.address; }
        }
        setStreet(parsedAddr.street || '');
        setCity(parsedAddr.city || '');
        setStateName(parsedAddr.state || '');
        setPin(parsedAddr.pin || '');
      } catch (e) {}
    }

    // Load cart from localStorage on mount
    const saved = localStorage.getItem('dishdash_cart')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCart(parsed)
        if (parsed.length > 0) {
          fetch('/api/products?tenantId=dishdash-solo')
            .then(r => r.json())
            .then(data => { setProducts(data); setLoading(false) })
            .catch(() => setLoading(false))
        } else { setLoading(false) }
      } catch (e) { setLoading(false) }
    } else { setLoading(false) }

    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [])

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.id)
    if (!product) return total
    const colorOpt = COLOR_OPTIONS.find(c => c.name === item.color) || { priceMultiplier: 1.0 }
    return total + Math.round(product.price * colorOpt.priceMultiplier) * item.qty
  }, 0)

  const cartItemCount = cart.reduce((t, i) => t + i.qty, 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !street || !city || !stateName || !pin || cart.length === 0) return
    setSubmitting(true)

    const formattedAddress = `${street}, ${city}, ${stateName} - ${pin}`;

    // Auto-save address as default profile address if logged in
    const savedCustomer = localStorage.getItem('dishdash_customer');
    if (savedCustomer) {
      try {
        const cust = JSON.parse(savedCustomer);
        const fullAddressJSON = JSON.stringify({ street, city, state: stateName, pin });
        fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cust.name, email: cust.email, phone: cust.phone, address: fullAddressJSON })
        });
        cust.address = fullAddressJSON;
        localStorage.setItem('dishdash_customer', JSON.stringify(cust));
      } catch (e) {}
    }
    
    try {
      const orderItems = cart.map(item => {
        const p = products.find(prod => prod.id === item.id)
        return { product_id: item.id, product_name: p?.name || 'Unknown', price: p?.price || 0, quantity: item.qty }
      })

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'dishdash-solo',
          customer_name: name,
          customer_phone: phone,
          payment_type: paymentMethod,
          source: 'web',
          items: orderItems,
          address: formattedAddress
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        if (paymentMethod === 'razorpay') {
          const rzpRes = await fetch('/api/payment/razorpay/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.id, amount: data.total })
          });

          const rzpData = await rzpRes.json();
          if (!rzpRes.ok || rzpData.error) {
            alert(rzpData.error || 'Failed to initiate Razorpay transaction');
            setSubmitting(false);
            return;
          }

          const options = {
            key: rzpData.keyId,
            amount: rzpData.amount,
            currency: rzpData.currency,
            name: 'DishDash Store',
            description: `Order #${data.id.slice(0, 8).toUpperCase()}`,
            order_id: rzpData.id,
            handler: async function (response: any) {
              const verifyRes = await fetch('/api/payment/razorpay/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: data.id
                })
              });
              if (verifyRes.ok) {
                localStorage.removeItem('dishdash_cart');
                setSuccessId(data.id);
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            },
            prefill: { name, contact: phone },
            theme: { color: '#1c1917' },
            modal: {
              ondismiss: async function () {
                // Auto-cancel the pending order
                await fetch('/api/orders/cancel', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: data.id })
                });
                // Return to homepage and auto-open the cart
                window.location.href = '/?cart=open';
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setSubmitting(false);
          return;
        } else {
          localStorage.removeItem('dishdash_cart')
          setSuccessId(data.id)
        }
      } else {
        alert(data.error || 'Failed to place order')
      }
    } catch (e) {
      alert('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
        <p className="text-sm font-semibold text-stone-500">Loading your cart...</p>
      </div>
    </div>
  )

  if (successId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-emerald-50/30 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white border border-stone-200 shadow-2xl p-8 sm:p-12 rounded-3xl max-w-md w-full text-center relative overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
          >
            <Check className="w-12 h-12 text-emerald-600 stroke-[2.5]" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-black text-stone-900 mb-2">Order Confirmed!</h1>
            <p className="text-stone-500 font-medium mb-8">Your payment was successful and order is placed.</p>
          </motion.div>

          {/* Order detail card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-stone-50 border border-stone-100 rounded-2xl p-5 mb-8 text-left space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-xs font-bold uppercase tracking-wider">Order ID</span>
              <span className="font-black text-stone-900 text-sm tracking-wide">#{successId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="h-px bg-stone-200" />
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-xs font-bold uppercase tracking-wider">Customer</span>
              <span className="font-bold text-stone-800 text-sm">{name}</span>
            </div>
            {street && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-stone-400 text-xs font-bold uppercase tracking-wider shrink-0">Ship To</span>
                <span className="font-medium text-stone-600 text-xs text-right">{street}, {city}, {stateName} - {pin}</span>
              </div>
            )}
            <div className="h-px bg-stone-200" />
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-xs font-bold uppercase tracking-wider">Amount Paid</span>
              <span className="font-black text-emerald-700 text-base">{formatINR(cartTotal)}</span>
            </div>
          </motion.div>

          {/* Estimated delivery notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-left"
          >
            <Truck className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 font-semibold">Estimated delivery within <span className="font-black">3–5 business days</span></p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-col gap-3"
          >
            <a href="/profile" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> Track My Order
            </a>
            <a href="/" className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
              Continue Shopping
            </a>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-bold text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to Store</span>
          </a>

          <div className="font-black text-xl tracking-tight text-stone-900 flex items-center gap-2 select-none">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            DishDash
          </div>

          {/* Secure badge */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="border-t border-stone-100 bg-stone-50">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${i <= step ? 'text-stone-900' : 'text-stone-300'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    i < step ? 'bg-emerald-500 text-white' :
                    i === step ? 'bg-stone-900 text-white' :
                    'bg-stone-200 text-stone-400'
                  }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 rounded-full transition-all ${i < step ? 'bg-emerald-400' : 'bg-stone-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 pb-32 lg:pb-12">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-stone-400" />
            </div>
            <h2 className="text-2xl font-black text-stone-900 mb-2">Your cart is empty</h2>
            <p className="text-stone-500 mb-6">Add some items before checking out.</p>
            <a href="/" className="bg-stone-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-stone-800 transition-colors">
              Browse Products
            </a>
          </div>
        ) : (
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_420px] gap-8">
            
            {/* ── LEFT: FORM ── */}
            <form onSubmit={handleCheckout} className="space-y-5">

            {/* ── PAYMENT FAILURE BANNER ── */}
          <AnimatePresence>
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-red-800 text-sm mb-1">Payment Not Completed</p>
                  <p className="text-xs text-red-600 font-medium leading-relaxed">{paymentError}</p>
                  <p className="text-xs text-red-500 font-semibold mt-2 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    Your cart is intact — you can try again below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentError('')}
                  className="text-red-400 hover:text-red-600 transition-colors text-lg font-bold leading-none shrink-0 cursor-pointer"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

            {/* Section 1: Contact */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900">Contact Information</h2>
                    <p className="text-xs text-stone-400 font-medium">For order updates and delivery</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Yuvraj Arora"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-900 text-sm font-semibold outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-900/10 transition-all placeholder:text-stone-300 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        type="tel"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-900 text-sm font-semibold outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-900/10 transition-all placeholder:text-stone-300 placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900">Delivery Address</h2>
                    <p className="text-xs text-stone-400 font-medium">Where should we send your order?</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Flat / House / Street / Area</label>
                    <input
                      required
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="e.g. Flat 4B, Bagwati Nagar, Main Road"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm font-semibold outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-900/10 transition-all placeholder:text-stone-300 placeholder:font-normal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">City / Town</label>
                      <input
                        required
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="e.g. Kotkapura"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm font-semibold outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-900/10 transition-all placeholder:text-stone-300 placeholder:font-normal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">State</label>
                      <input
                        required
                        value={stateName}
                        onChange={e => setStateName(e.target.value)}
                        placeholder="e.g. Punjab"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm font-semibold outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-900/10 transition-all placeholder:text-stone-300 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">PIN Code</label>
                    <input
                      required
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      placeholder="6-digit postal code"
                      maxLength={6}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm font-semibold outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-900/10 transition-all placeholder:text-stone-300 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900">Payment Method</h2>
                    <p className="text-xs text-stone-400 font-medium">All transactions are 256-bit SSL encrypted</p>
                  </div>
                </div>
                <div className="p-6">
                  {/* Razorpay selected option */}
                  <div className="border-2 border-stone-900 bg-stone-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#072654] flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none">
                        <polygon points="15,85 50,5 85,85 60,55 50,75 40,55" fill="#00BCD4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-stone-900 text-sm">Razorpay</p>
                      <p className="text-xs text-stone-500">UPI · Cards · Net Banking · Wallets</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['256-bit SSL', 'PCI DSS Compliant', 'Encrypted'].map(badge => (
                      <span key={badge} className="text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 rounded-full px-2.5 py-1 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Consents */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-stone-400 uppercase tracking-wider mb-4">Required Consents</h3>
                {[
                  { href: '/policies/terms', label: 'Terms of Service', text: 'I agree to the' },
                  { href: '/policies/privacy', label: 'Privacy Policy', text: 'I consent to the' },
                  { href: '/policies/refund', label: 'Refund Policy', text: 'I acknowledge the' },
                ].map(({ href, label, text }) => (
                  <label key={href} className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input required defaultChecked type="checkbox" className="peer w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer" />
                    </div>
                    <span className="text-xs text-stone-500 font-medium leading-relaxed group-hover:text-stone-700 transition-colors">
                      {text} <a href={href} target="_blank" className="text-stone-900 font-bold underline underline-offset-2 hover:text-stone-600">{label}</a>
                    </span>
                  </label>
                ))}
              </div>

              {/* Submit Button — desktop only */}
              <div className="hidden lg:block">
                <button
                  disabled={submitting}
                  type="submit"
                  className="w-full bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-base"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Place Order Securely <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
                <p className="text-center text-xs text-stone-400 font-medium mt-3">
                  You will be redirected to Razorpay's secure payment page.
                </p>
              </div>
            </form>

            {/* ── RIGHT: ORDER SUMMARY ── */}
            <div className="space-y-5">
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm lg:sticky lg:top-36">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-base font-black text-stone-900">Order Summary</h2>
                  <span className="text-xs bg-stone-100 border border-stone-200 text-stone-700 font-bold px-2.5 py-1 rounded-full">
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                  {cart.map(item => {
                    const product = products.find(p => p.id === item.id)
                    const colorOpt = COLOR_OPTIONS.find(c => c.name === item.color) || { priceMultiplier: 1.0 }
                    const adjustedPrice = Math.round((product?.price || 0) * colorOpt.priceMultiplier)
                    const images = typeof product?.images === 'string' ? JSON.parse(product?.images || '[]') : (product?.images || [])
                    const imgSrc = images[0] || null

                    return (
                      <div key={`${item.id}-${item.color}`} className="px-6 py-4 flex items-center gap-4">
                        {/* Product thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                          {imgSrc ? (
                            <img src={imgSrc} alt={product?.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-stone-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-stone-900 text-sm truncate">{product?.name || 'Loading...'}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-stone-400 font-medium">Qty: {item.qty}</span>
                            {item.color && item.color !== 'Standard' && (
                              <span className="text-xs text-stone-400">· {item.color}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-stone-900 text-sm shrink-0">{formatINR(adjustedPrice * item.qty)}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Totals */}
                <div className="px-6 py-5 bg-stone-50/50 border-t border-stone-100 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500 font-semibold">Subtotal</span>
                    <span className="font-bold text-stone-700">{formatINR(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500 font-semibold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Delivery
                    </span>
                    <span className="text-emerald-600 font-black">FREE</span>
                  </div>
                  <div className="h-px bg-stone-200 border-dashed" />
                  <div className="flex justify-between items-center">
                    <span className="text-stone-900 font-black text-lg">Total</span>
                    <span className="text-stone-900 font-black text-xl">{formatINR(cartTotal)}</span>
                  </div>
                </div>

                {/* Delivery estimate */}
                <div className="px-6 pb-5">
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700 font-semibold">Estimated delivery: <span className="font-black">3–5 business days</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE STICKY SUBMIT ── */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 z-40 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-stone-500 font-semibold">Order Total</span>
            <span className="font-black text-stone-900 text-lg">{formatINR(cartTotal)}</span>
          </div>
          <button
            disabled={submitting}
            form="checkout-form"
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              <><Lock className="w-4 h-4" /> Place Order Securely</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
