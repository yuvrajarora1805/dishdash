"use client";

import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { formatINR } from '@/lib/utils';

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

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('Standard');
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [customer, setCustomer] = useState<any | null>(null);

  // Sync cart counter & customer details
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
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {}
    }
  }, []);

  const colorOpt = COLOR_OPTIONS.find(c => c.name === selectedColor) || { priceMultiplier: 1.0 };
  const adjustedPrice = Math.round(product.price * colorOpt.priceMultiplier);

  const handleAddToCart = (redirect: boolean = false) => {
    if (stock <= 0) return;
    
    const saved = localStorage.getItem('dishdash_cart');
    let cart: any[] = [];
    if (saved) {
      try {
        cart = JSON.parse(saved);
      } catch (e) {}
    }

    const existing = cart.find(item => item.id === product.id && item.color === selectedColor);
    if (existing) {
      if (redirect) {
        existing.qty = quantity; // Direct checkout replaces the quantity
      } else {
        existing.qty += quantity; // Standard add increments the quantity
      }
    } else {
      cart.push({ id: product.id, qty: quantity, color: selectedColor });
    }

    localStorage.setItem('dishdash_cart', JSON.stringify(cart));
    setCartCount(cart.reduce((acc: number, item: any) => acc + item.qty, 0));

    if (redirect) {
      window.location.href = '/checkout';
    } else {
      alert(`${product.name} (${selectedColor}) added to cart!`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-600 pb-20">
      
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-bold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Store
            </a>
          </div>
          <div className="font-bold text-2xl tracking-tight text-stone-900 flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Dish<span className="text-stone-500 font-normal">Dash</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="relative p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-700 mr-2">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </a>
            
            {customer ? (
              <div className="flex items-center gap-3 border-l border-stone-200 pl-3">
                <a href="/profile" className="text-xs font-bold text-stone-700 hover:underline">Hi, {customer.name.split(' ')[0]}</a>
                <button 
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    localStorage.removeItem('dishdash_customer');
                    setCustomer(null);
                    window.location.reload();
                  }}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer bg-white"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <a 
                href="/login" 
                className="text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 px-4 py-2 rounded-full transition-colors cursor-pointer shadow-sm border border-stone-900"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 pt-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image Gallery (Vertical Strip + Big Image) */}
        <div className="lg:col-span-5 flex flex-col md:flex-row gap-4">
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {images.map((url: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                    activeImageIndex === index ? 'border-stone-900' : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt="product thumbnail" />
                </button>
              ))}
            </div>
          )}
          
          <div className="flex-1 aspect-square rounded-[2rem] overflow-hidden bg-white border border-stone-200 relative flex items-center justify-center order-1 md:order-2 p-2">
            <img 
              src={images[activeImageIndex] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"} 
              className="w-full h-full object-cover rounded-[1.5rem]" 
              alt={product.name} 
            />
          </div>
        </div>

        {/* Center Column: Description & Customization */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {subcategory ? `${tag} › ${subcategory}` : tag}
            </span>
            <h1 className="text-3xl font-black text-stone-900 leading-tight mt-1 mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-1 text-sm font-bold text-stone-700">
              <span className="text-amber-500 flex items-center"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9</span>
              <span className="text-stone-300">|</span>
              <span className="underline cursor-pointer hover:text-stone-900">128 ratings</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-b border-stone-200 pb-4">
            <div className="text-xs uppercase font-bold text-stone-400 tracking-wider mb-1.5">AOV Price</div>
            <div className="text-3xl font-black text-stone-900">{formatINR(adjustedPrice)}</div>
            <p className="text-xs text-stone-400 mt-1">Inclusive of all local storefront duties & handling taxes.</p>
          </div>

          {/* Color options */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-stone-400">Select Finish / Variant</h3>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setSelectedColor(opt.name)}
                  className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                    selectedColor === opt.name ? 'border-stone-900 scale-110 shadow-sm' : 'border-stone-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: opt.hex }}
                >
                  {selectedColor === opt.name && (
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />
                  )}
                </button>
              ))}
            </div>
            <span className="text-xs text-stone-500 font-semibold block">
              Selected: <span className="text-stone-950 font-bold">{selectedColor}</span>
              {colorOpt.priceMultiplier > 1 && ` (Premium Finish +${Math.round((colorOpt.priceMultiplier - 1) * 100)}%)`}
            </span>
          </div>

          {/* Description features */}
          <div className="space-y-3 border-t border-stone-200 pt-6">
            <h3 className="text-xs uppercase font-bold tracking-wider text-stone-400">About this item</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              {product.data?.description || "Experience the ultimate standard in design and reliability. This product features premium materials, meticulously crafted details, and top-tier performance for all daily uses."}
            </p>
            <ul className="text-xs text-stone-500 space-y-2 list-disc pl-4 font-medium">
              <li>Meticulously designed standalone item for solo tenants.</li>
              <li>Sourced from authorized manufacturers using high-grade components.</li>
              <li>Tested for strict hardware compliance and long lifespan.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Amazon-Style BUY BOX */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-md space-y-5 sticky top-24">
            
            {/* Price Box */}
            <div>
              <div className="text-3xl font-black text-stone-900">{formatINR(adjustedPrice)}</div>
              <div className="text-emerald-600 font-bold text-sm mt-1 flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> FREE delivery tomorrow
              </div>
            </div>

            {/* Stock status */}
            <div>
              {stock === 0 ? (
                <div className="text-red-600 font-bold text-sm">Currently Out of Stock.</div>
              ) : stock <= 5 ? (
                <div className="text-amber-600 font-bold text-sm">Only {stock} items left in stock - order soon.</div>
              ) : (
                <div className="text-emerald-600 font-bold text-sm">In Stock.</div>
              )}
            </div>

            {/* Quantity Stepper */}
            {stock > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Quantity</label>
                <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 w-full">
                  <button 
                    type="button" 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="text-stone-500 hover:text-stone-900 font-bold px-2 cursor-pointer text-lg"
                  >
                    -
                  </button>
                  <span className="font-bold text-stone-900 text-base">{quantity}</span>
                  <button 
                    type="button" 
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="text-stone-500 hover:text-stone-900 font-bold px-2 cursor-pointer text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 z-50 flex gap-3 lg:static lg:bg-transparent lg:border-none lg:p-0 lg:flex-col lg:z-auto">
              <button
                disabled={stock === 0}
                onClick={() => handleAddToCart(false)}
                className="flex-1 lg:w-full bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Add to Cart
              </button>
              <button
                disabled={stock === 0}
                onClick={() => handleAddToCart(true)}
                className="flex-1 lg:w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            {/* Security assurances */}
            <div className="border-t border-stone-100 pt-4 space-y-3 text-xs text-stone-400 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-400" />
                <span>Secure payment transaction</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-stone-400" />
                <span>10-day replacement policy</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-stone-200 mt-32 py-12 px-4 relative z-10 lg:pb-12 pb-32">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-stone-900">DishDash</span>
            <span className="text-stone-400 font-medium text-sm">© 2026. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-stone-500 font-semibold">
            <a href="/policies/terms" className="hover:text-stone-900 transition-colors">Terms of Service</a>
            <a href="/policies/privacy" className="hover:text-stone-900 transition-colors">Privacy Policy</a>
            <a href="/policies/refund" className="hover:text-stone-900 transition-colors">Refund Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
