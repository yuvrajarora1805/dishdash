"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Loader2, Phone, User, MapPin } from 'lucide-react'
import { formatINR } from '@/lib/utils'

const COLOR_OPTIONS = [
  { name: 'Standard', hex: '#78716c', priceMultiplier: 1.0 },
  { name: 'Silver Metal', hex: '#cbd5e1', priceMultiplier: 1.0 },
  { name: 'Midnight Spark', hex: '#1e293b', priceMultiplier: 1.1 },
  { name: 'Rose Gold', hex: '#fda4af', priceMultiplier: 1.05 }
];

export default function CheckoutPage() {
  const [cart, setCart] = useState<{id: string, qty: number, color: string}[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState('')

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
    if (err) {
      alert(err === 'payment_failed' ? 'Payment failed. Please try again.' : 'An error occurred during payment.')
    }

    // Pre-fill customer details & address if logged in
    const savedCustomer = localStorage.getItem('dishdash_customer');
    if (savedCustomer) {
      try {
        const cust = JSON.parse(savedCustomer);
        setName(cust.name);
        setPhone(cust.phone);

        // Try to parse structured address JSON payload
        let parsedAddr = { street: '', city: '', state: '', pin: '' };
        if (cust.address) {
          try {
            parsedAddr = JSON.parse(cust.address);
          } catch (e) {
            parsedAddr.street = cust.address; // Fallback if plain string
          }
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
            .then(data => {
              setProducts(data)
              setLoading(false)
            })
            .catch(() => setLoading(false))
        } else {
          setLoading(false)
        }
      } catch (e) { setLoading(false) }
    } else {
      setLoading(false)
    }

    return () => {
      // Clean up script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [])

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.id)
    if (!product) return total
    const colorOpt = COLOR_OPTIONS.find(c => c.name === item.color) || { priceMultiplier: 1.0 }
    const adjustedPrice = Math.round(product.price * colorOpt.priceMultiplier)
    return total + adjustedPrice * item.qty
  }, 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !street || !city || !stateName || !pin || cart.length === 0) return
    setSubmitting(true)

    // Format address string for the delivery team
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
        return {
          product_id: item.id,
          product_name: p?.name || 'Unknown',
          price: p?.price || 0,
          quantity: item.qty
        }
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
          // Initiate Razorpay checkout order
          const rzpRes = await fetch('/api/payment/razorpay/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.id,
              amount: data.total
            })
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
            description: `Order #${data.id.slice(0, 8)}`,
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
                alert('Payment verification signature check failed.');
              }
            },
            prefill: {
              name,
              contact: phone
            },
            theme: {
              color: '#1c1917'
            },
            modal: {
              ondismiss: async function () {
                // Auto-cancel order on popup close or cancellation
                await fetch('/api/orders/cancel', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: data.id })
                });
                window.location.href = '/checkout?error=payment_failed';
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setSubmitting(false);
          return;
        } else if (paymentMethod === 'payu') {
          // Initiate PayU Payment
          const txnid = 'txn_' + Math.random().toString(36).substr(2, 9) + Date.now();
          const payuRes = await fetch('/api/payment/payu/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txnid,
              amount: data.total,
              productinfo: `Order ${data.id}`,
              firstname: name,
              email: 'customer@dishdash.com',
              phone: phone,
              udf1: data.id
            })
          });

          const payuData = await payuRes.json();
          if (payuRes.ok && payuData.success) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payuData.actionUrl;

            const fields = {
              key: payuData.key,
              txnid: payuData.txnid,
              amount: payuData.amount,
              productinfo: payuData.productinfo,
              firstname: payuData.firstname,
              email: payuData.email,
              phone: payuData.phone,
              surl: payuData.surl,
              furl: payuData.furl,
              hash: payuData.hash,
              udf1: payuData.udf1
            };

            for (const [k, v] of Object.entries(fields)) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = k;
              input.value = String(v);
              form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();
            return;
          } else {
            alert(payuData.error || 'Failed to initiate payment gateway');
          }
        } else {
          localStorage.removeItem('dishdash_cart')
          setSuccessId(data.id)
        }
      } else {
        alert(data.error || 'Failed to place order')
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-900" /></div>

  if (successId) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 pt-10 pb-20">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white border border-stone-200 shadow-xl p-6 sm:p-10 rounded-3xl max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-2">Order Confirmed!</h1>
          <p className="text-stone-500 font-semibold mb-6">We've securely received your order.</p>
          
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-wide">Order ID</span>
              <span className="font-bold text-stone-900 text-sm">#{successId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-wide">Delivery To</span>
              <span className="font-bold text-stone-900 text-sm">{name}</span>
            </div>
            <div className="text-xs text-stone-500 font-medium text-right line-clamp-1">{street}, {city}</div>
          </div>
          
          <div className="flex flex-col gap-3">
            <a href="/profile" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md select-none">
              View My Orders
            </a>
            <a href="/" className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3.5 rounded-xl transition-all select-none">
              Continue Shopping
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-10 px-4">
      <div className="max-w-5xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-8 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </a>
        
        <h1 className="text-4xl font-black text-stone-900 mb-10">Secure Checkout</h1>
        
        {cart.length === 0 ? (
          <div className="text-center py-20 text-stone-500">Your cart is empty.</div>
        ) : (
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <form onSubmit={handleCheckout} className="space-y-8">
              <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Contact Information</h2>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" />
                </div>
              </div>

              {/* Structured Address Entry */}
              <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-2xl space-y-4">
                <h2 className="text-xl font-bold text-stone-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-stone-900" /> Delivery Details
                </h2>
                
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-stone-450">Flat / Street / Area</label>
                  <input required value={street} onChange={e => setStreet(e.target.value)} placeholder="Flat No, Building, Street Name" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-stone-450">City</label>
                    <input required value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New Delhi" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-stone-450">State</label>
                    <input required value={stateName} onChange={e => setStateName(e.target.value)} placeholder="e.g. Delhi" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-stone-450">PIN / Postal Code</label>
                  <input required value={pin} onChange={e => setPin(e.target.value)} placeholder="e.g. 110001" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" />
                </div>
              </div>

              <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-stone-900">Secure Payment</h2>
                  <p className="text-xs text-stone-500 font-semibold">Your transaction is fully encrypted and secured via Razorpay.</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 font-black text-xs text-amber-800 uppercase tracking-wider flex items-center gap-1.5 select-none">
                  🛡️ Razorpay Secure
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-2xl space-y-3">
                <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">Required Consents</h3>
                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-stone-600 font-medium select-none">
                    <input required defaultChecked type="checkbox" className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 border-stone-300" />
                    <span>I agree to the <a href="/policies/terms" target="_blank" className="underline text-stone-900 font-bold hover:text-stone-700">Terms of Service</a> and authorize billing for this order.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-stone-600 font-medium select-none">
                    <input required defaultChecked type="checkbox" className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 border-stone-300" />
                    <span>I read and consent to the <a href="/policies/privacy" target="_blank" className="underline text-stone-900 font-bold hover:text-stone-700">Privacy Policy</a> governing transaction protection.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-stone-600 font-medium select-none">
                    <input required defaultChecked type="checkbox" className="mt-0.5 rounded text-stone-900 focus:ring-stone-900 border-stone-300" />
                    <span>I acknowledge the store <a href="/policies/refund" target="_blank" className="underline text-stone-900 font-bold hover:text-stone-700">Refund Policy</a> applies to all shipping packages.</span>
                  </label>
                </div>
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
              </button>
            </form>

            {/* Order Summary */}
            <div className="space-y-8">
              <div className="bg-white border border-stone-200 shadow-sm p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-stone-900 mb-6">Order Summary</h2>
                <div className="divide-y divide-stone-150">
                  {cart.map(item => {
                    const product = products.find(p => p.id === item.id)
                    const colorOpt = COLOR_OPTIONS.find(c => c.name === item.color) || { priceMultiplier: 1.0 }
                    const adjustedPrice = Math.round((product?.price || 0) * colorOpt.priceMultiplier)

                    return (
                      <div key={`${item.id}-${item.color}`} className="py-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-stone-900 text-sm">{product?.name || 'Loading...'}</h3>
                          <div className="text-xs text-stone-400 mt-0.5">
                            <span>Qty: {item.qty}</span>
                            {item.color && (
                              <span className="ml-3 font-semibold text-stone-500">Color: {item.color}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-stone-900 text-sm">{formatINR(adjustedPrice * item.qty)}</span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="border-t border-stone-200 pt-6 mt-6 space-y-3">
                  <div className="flex justify-between text-stone-500 text-sm">
                    <span>Subtotal</span>
                    <span className="font-semibold text-stone-700">{formatINR(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500 text-sm">
                    <span>Delivery</span>
                    <span className="text-emerald-600 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between text-stone-900 text-lg font-black border-t border-dashed border-stone-200 pt-4 mt-4">
                    <span>Total</span>
                    <span>{formatINR(cartTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
