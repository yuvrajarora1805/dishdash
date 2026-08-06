"use client";

import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ArrowLeft, ShieldCheck, Truck, RotateCcw, Check, ChevronRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_OPTIONS = [
  { name: 'Standard', hex: '#78716c', priceMultiplier: 1.0 },
  { name: 'Silver Metal', hex: '#cbd5e1', priceMultiplier: 1.0 },
  { name: 'Midnight Spark', hex: '#1e293b', priceMultiplier: 1.1 },
  { name: 'Rose Gold', hex: '#fda4af', priceMultiplier: 1.05 }
];

export default function ProductDetailClient({ product }: { product: any }) {
  const images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
  const tag = product.data?.tag || 'General';
  const subcategory = product.data?.subcategory;
  const stock = Number(product.data?.stock) || 0;
  const replacementPolicy = product.data?.replacement_policy || null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('Standard');
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [customer, setCustomer] = useState<any | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('dishdash_cart');
    if (saved) {
      try {
        const cart = JSON.parse(saved);
        setCartCount(cart.reduce((acc: number, item: any) => acc + item.qty, 0));
      } catch (e) {}
    }
    const savedCustomer = localStorage.getItem('dishdash_customer');
    if (savedCustomer) {
      try { setCustomer(JSON.parse(savedCustomer)); } catch (e) {}
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const colorOpt = COLOR_OPTIONS.find(c => c.name === selectedColor) || { priceMultiplier: 1.0 };
  const adjustedPrice = Math.round(product.price * colorOpt.priceMultiplier);

  const handleAddToCart = (redirect: boolean = false) => {
    if (stock <= 0) return;
    const saved = localStorage.getItem('dishdash_cart');
    let cart: any[] = [];
    if (saved) { try { cart = JSON.parse(saved); } catch (e) {} }

    const existing = cart.find(item => item.id === product.id && item.color === selectedColor);
    if (existing) {
      existing.qty = redirect ? quantity : existing.qty + quantity;
    } else {
      cart.push({ id: product.id, qty: quantity, color: selectedColor });
    }

    localStorage.setItem('dishdash_cart', JSON.stringify(cart));
    setCartCount(cart.reduce((acc: number, item: any) => acc + item.qty, 0));

    if (redirect) {
      window.location.href = '/checkout';
    } else {
      showToast(`${product.name} added to cart!`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-600">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-stone-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <Check className="w-4 h-4 text-emerald-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">

          {/* Back */}
          <a href="/" className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors font-bold text-sm shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Store</span>
          </a>

          {/* Logo — center */}
          <div className="font-bold text-lg sm:text-2xl tracking-tight text-stone-900 flex items-center gap-1.5 select-none">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-stone-900 flex items-center justify-center shadow-md shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>Dish<span className="text-stone-400 font-normal">Dash</span></span>
          </div>

          {/* Right: Cart + Auth */}
          <div className="flex items-center gap-2 shrink-0">
            <a href="/" className="relative p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-700">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </a>
            {customer ? (
              <div className="flex items-center gap-1.5 border-l border-stone-200 pl-2">
                <a href="/profile" className="text-xs font-bold text-stone-700 hover:underline hidden sm:inline">
                  Hi, {customer.name.split(' ')[0]}
                </a>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    localStorage.removeItem('dishdash_customer');
                    setCustomer(null);
                    window.location.reload();
                  }}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 border border-stone-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer bg-white"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <a href="/login" className="text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-stone-900">
                Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      {/* pb-28 on mobile so sticky CTA bar doesn't cover content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-28 lg:pb-12">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-stone-400 font-semibold py-3 mb-2">
          <a href="/" className="hover:text-stone-900 transition-colors">Home</a>
          <ChevronRight className="w-3 h-3" />
          <span>{tag}</span>
          {subcategory && <><ChevronRight className="w-3 h-3" /><span>{subcategory}</span></>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── IMAGE GALLERY ── */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Main image */}
            <div className="aspect-square rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white border border-stone-200 relative flex items-center justify-center p-2">
              <img
                src={images[activeImageIndex] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"}
                className="w-full h-full object-cover rounded-xl sm:rounded-[1.5rem]"
                alt={product.name}
              />
              {/* Stock badge on image */}
              {stock > 0 && stock <= 5 && (
                <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Only {stock} left
                </div>
              )}
              {stock === 0 && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                  <span className="bg-white border border-stone-300 text-stone-700 font-black px-4 py-2 rounded-xl text-sm shadow">Out of Stock</span>
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                      activeImageIndex === index ? 'border-stone-900 shadow-sm' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <img src={url} className="w-full h-full object-cover" alt="thumbnail" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── PRODUCT INFO ── */}
          <div className="lg:col-span-4 space-y-5">
            {/* Title block */}
            <div className="border-b border-stone-200 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {subcategory ? `${tag} › ${subcategory}` : tag}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight mt-1 mb-3">{product.name}</h1>
              <div className="flex items-center gap-1.5 text-sm font-bold text-stone-700">
                <span className="text-amber-500 flex items-center gap-0.5"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9</span>
                <span className="text-stone-300">|</span>
                <span className="underline cursor-pointer hover:text-stone-900 text-stone-500">128 ratings</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-b border-stone-200 pb-4">
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Price</div>
              <div className="text-3xl font-black text-stone-900">{formatINR(adjustedPrice)}</div>
              <p className="text-xs text-stone-400 mt-1">Inclusive of all taxes & duties.</p>
            </div>

            {/* Color options */}
            <div className="space-y-3 border-b border-stone-200 pb-5">
              <h3 className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                Finish / Variant: <span className="text-stone-900 normal-case">{selectedColor}</span>
                {(colorOpt as any).priceMultiplier > 1 && (
                  <span className="text-stone-400 font-normal"> (+{Math.round(((colorOpt as any).priceMultiplier - 1) * 100)}%)</span>
                )}
              </h3>
              <div className="flex gap-3">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setSelectedColor(opt.name)}
                    title={opt.name}
                    className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                      selectedColor === opt.name ? 'border-stone-900 scale-110 shadow-md' : 'border-stone-200 hover:scale-105 hover:border-stone-400'
                    }`}
                    style={{ backgroundColor: opt.hex }}
                  >
                    {selectedColor === opt.name && <span className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-[10px] uppercase font-bold tracking-wider text-stone-400">About this item</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                {product.data?.description || "Experience the ultimate standard in design and reliability. This product features premium materials, meticulously crafted details, and top-tier performance for all daily uses."}
              </p>
              <ul className="text-xs text-stone-500 space-y-1.5 list-disc pl-4 font-medium">
                <li>Premium quality, rigorously tested for durability.</li>
                <li>Sourced from authorized manufacturers.</li>
                <li>Optimized for everyday modern use.</li>
              </ul>
            </div>

            {/* Replacement policy badge if set */}
            {replacementPolicy && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <RotateCcw className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-blue-700">{replacementPolicy}</span>
              </div>
            )}
          </div>

          {/* ── BUY BOX (desktop sidebar) ── */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-md space-y-5 sticky top-24">
              <div>
                <div className="text-3xl font-black text-stone-900">{formatINR(adjustedPrice)}</div>
                <div className="text-emerald-600 font-bold text-sm mt-1 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> FREE delivery
                </div>
              </div>

              <div>
                {stock === 0 ? (
                  <div className="text-red-600 font-bold text-sm">Currently Out of Stock.</div>
                ) : stock <= 5 ? (
                  <div className="text-amber-600 font-bold text-sm">Only {stock} left — order soon!</div>
                ) : (
                  <div className="text-emerald-600 font-bold text-sm">In Stock.</div>
                )}
              </div>

              {stock > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Quantity</label>
                  <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-2">
                    <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="text-stone-500 hover:text-stone-900 font-bold px-2 cursor-pointer text-lg">−</button>
                    <span className="font-bold text-stone-900 text-base">{quantity}</span>
                    <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="text-stone-500 hover:text-stone-900 font-bold px-2 cursor-pointer text-lg">+</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button disabled={stock === 0} onClick={() => handleAddToCart(false)} className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                  Add to Cart
                </button>
                <button disabled={stock === 0} onClick={() => handleAddToCart(true)} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                  Buy Now
                </button>
              </div>

              <div className="border-t border-stone-100 pt-4 space-y-2.5 text-xs text-stone-400 font-medium">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-stone-400" /><span>Secure Razorpay payment</span></div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-stone-400" />
                  <span>{replacementPolicy || 'No replacement policy'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── STICKY MOBILE CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-2xl">
        {/* Stock status strip */}
        <div className="px-4 pt-2.5 pb-0 flex items-center justify-between">
          <div className="text-xs font-bold">
            {stock === 0 ? (
              <span className="text-red-600">Out of Stock</span>
            ) : stock <= 5 ? (
              <span className="text-amber-600">Only {stock} left!</span>
            ) : (
              <span className="text-emerald-600">In Stock</span>
            )}
          </div>
          {/* Inline quantity on mobile */}
          {stock > 0 && (
            <div className="flex items-center gap-3 bg-stone-100 rounded-full px-3 py-1">
              <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="text-stone-600 font-black text-base cursor-pointer w-5 text-center">−</button>
              <span className="font-bold text-stone-900 text-sm w-4 text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="text-stone-600 font-black text-base cursor-pointer w-5 text-center">+</button>
            </div>
          )}
          <div className="font-black text-stone-900 text-base">{formatINR(adjustedPrice)}</div>
        </div>
        <div className="p-3 flex gap-2.5">
          <button disabled={stock === 0} onClick={() => handleAddToCart(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 text-sm">
            Add to Cart
          </button>
          <button disabled={stock === 0} onClick={() => handleAddToCart(true)} className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50 text-sm">
            Buy Now
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-stone-200 mt-16 py-10 px-4 lg:pb-10 pb-36">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-stone-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-stone-900">DishDash</span>
            <span className="text-stone-400 text-xs">© 2026. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-stone-500 font-semibold">
            <a href="/policies/terms" className="hover:text-stone-900 transition-colors">Terms</a>
            <a href="/policies/privacy" className="hover:text-stone-900 transition-colors">Privacy</a>
            <a href="/policies/refund" className="hover:text-stone-900 transition-colors">Refund Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
