"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Search, Menu, X, ArrowRight, Star } from 'lucide-react'
import { formatINR } from '@/lib/utils'

const COLOR_OPTIONS = [
  { name: 'Standard', hex: '#78716c', priceMultiplier: 1.0 },
  { name: 'Silver Metal', hex: '#cbd5e1', priceMultiplier: 1.0 },
  { name: 'Midnight Spark', hex: '#1e293b', priceMultiplier: 1.1 },
  { name: 'Rose Gold', hex: '#fda4af', priceMultiplier: 1.05 }
];

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cart, setCart] = useState<{id: string, qty: number, color: string}[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Shop All')
  const [customer, setCustomer] = useState<any | null>(null)

  // Quick View Modal States
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('Standard')
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Fetch products for the homepage
    fetch('/api/products?tenantId=dishdash-solo')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.products) {
          setProducts(data.products);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load cart from localStorage on mount
    const saved = localStorage.getItem('dishdash_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {}
    }

    // Load customer from localStorage on mount
    const savedCustomer = localStorage.getItem('dishdash_customer');
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {}
    }

    // Auto-open cart if redirected from a failed payment
    const params = new URLSearchParams(window.location.search);
    if (params.get('cart') === 'open') {
      setIsCartOpen(true);
      // Clean the URL so a refresh doesn't re-open the cart
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [])

  // Save cart to localStorage when updated
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('dishdash_cart', JSON.stringify(cart));
    }
  }, [cart, loading])

  const addToCart = (id: string, color: string = 'Standard', qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id && item.color === color)
      if (existing) {
        return prev.map(item => item.id === id && item.color === color ? { ...item, qty: item.qty + qty } : item)
      }
      return [...prev, { id, qty, color }]
    })
    setIsCartOpen(true)
  }

  const updateCartQty = (id: string, color: string, change: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id && i.color === color)
      if (!item) return prev
      const newQty = item.qty + change
      if (newQty <= 0) {
        return prev.filter(i => !(i.id === id && i.color === color))
      }
      return prev.map(i => i.id === id && i.color === color ? { ...i, qty: newQty } : i)
    })
  }

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.id)
    if (!product) return total
    const colorOpt = COLOR_OPTIONS.find(c => c.name === item.color) || { priceMultiplier: 1.0 }
    const adjustedPrice = Math.round(product.price * colorOpt.priceMultiplier)
    return total + adjustedPrice * item.qty
  }, 0)

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0)

  // Filtering products based on category tag
  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'Shop All') return true;
    if (selectedCategory === 'Daily Essentials') {
      return product.data?.tag === 'Daily Essentials';
    }
    if (selectedCategory === 'Tech') {
      return product.data?.tag === 'Electronics';
    }
    if (selectedCategory === 'Lifestyle') {
      return product.data?.tag === 'Daily Essentials' && product.data?.subcategory === 'Lifestyle';
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-0 overflow-hidden relative bg-stone-50">
      
      {/* ── BACKGROUND GLOWS (Subtle Light Version) ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-stone-200/50 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-stone-200/50 blur-[150px]" />
      </div>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5 text-stone-700" />
            </button>
            <div className="font-bold text-2xl tracking-tight text-stone-900 flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Dish<span className="text-stone-500 font-normal">Dash</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-stone-500">
            {['Shop All', 'Daily Essentials', 'Tech', 'Lifestyle'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)} 
                className={`transition-colors cursor-pointer text-sm font-bold ${selectedCategory === cat ? 'text-stone-900' : 'hover:text-stone-900 text-stone-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-700 hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-700 mr-2"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
            
            {customer ? (
              <div className="flex items-center gap-3 border-l border-stone-250 pl-3">
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

      {/* ── MOBILE MENU DRAWER ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-white z-50 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div className="font-bold text-xl text-stone-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  DishDash
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-500 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-2">Categories</h3>
                  {['Shop All', 'Daily Essentials', 'Tech', 'Lifestyle'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setIsMobileMenuOpen(false); }} 
                      className={`text-left px-4 py-3 rounded-xl font-bold transition-colors ${selectedCategory === cat ? 'bg-stone-900 text-white' : 'hover:bg-stone-50 text-stone-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-stone-100">
                {customer ? (
                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-bold text-stone-900 px-2">Hi, {customer.name}</div>
                    <a href="/profile" className="text-center bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-3 rounded-xl transition-colors">My Profile & Orders</a>
                    <button 
                      onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        localStorage.removeItem('dishdash_customer');
                        window.location.reload();
                      }}
                      className="text-center border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300 font-bold py-3 rounded-xl transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <a href="/login" className="block text-center bg-stone-900 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
                    Sign In to Account
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 pt-32 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="lg:w-1/2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-200 bg-white text-stone-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              ✨ Premium Daily Goods
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6 text-stone-900">
              Upgrade Your <br />
              <span className="text-gradient">Everyday Life.</span>
            </h1>
            <p className="text-stone-500 text-lg mb-8 max-w-md leading-relaxed">
              Discover a curated collection of high-end electronics and premium daily essentials designed for modern living.
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedCategory('Shop All')}
                className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-4 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                Start Shopping
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSelectedCategory('Tech')}
                className="px-8 py-4 rounded-full font-bold text-stone-700 border border-stone-300 hover:bg-stone-100 transition-all cursor-pointer"
              >
                Explore Tech
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 relative"
          >
            {products.length > 0 ? (
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden relative glass-card p-2 cursor-pointer group" onClick={() => { window.location.href = `/product/${products[0].id}`; }}>
                <img 
                  src={products[0].images?.[0] || "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&auto=format&fit=crop&q=80"} 
                  alt={products[0].name} 
                  className="w-full h-full object-cover rounded-[1.5rem] transition-transform duration-700 group-hover:scale-105 bg-stone-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0 rounded-[1.5rem]" />
                <div className="absolute bottom-6 left-6 right-6 glass p-4 rounded-2xl flex items-center justify-between border-none">
                  <div>
                    <h3 className="font-bold text-white text-lg">{products[0].name}</h3>
                    <p className="text-sm text-stone-200 font-medium">{products[0].data?.tag || 'Trending'}</p>
                  </div>
                  <div className="font-black text-xl text-stone-900 bg-white px-4 py-1 rounded-full shadow-lg">
                    {formatINR(products[0].price)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden relative glass-card p-2 bg-white flex items-center justify-center border border-stone-200">
                 <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── PRODUCT GRID (Dynamic Trending) ── */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black mb-2 text-stone-900">Trending Products</h2>
              <p className="text-stone-500">The most popular items right now</p>
            </div>
            
            {/* Category Select Navigation bar */}
            <div className="flex flex-wrap items-center gap-2 border border-stone-200 bg-white p-1 rounded-full shadow-sm">
              {['Shop All', 'Daily Essentials', 'Tech', 'Lifestyle'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-transparent text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-stone-500 border border-dashed border-stone-300 rounded-2xl bg-white">
              Loading live products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-stone-500 border border-dashed border-stone-300 rounded-2xl bg-white flex-col gap-2">
              <p className="font-semibold">No products found in "{selectedCategory}".</p>
              <p className="text-xs text-stone-400">Go to the Admin panel to add some items with this category tag!</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => {
                const images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
                const imageSrc = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
                const tag = product.data?.tag || 'Trending';
                
                return (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => { window.location.href = `/product/${product.id}`; }}
                    className="glass-card rounded-[1.5rem] p-3 group flex flex-col hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden relative mb-4 bg-stone-100">
                      <img 
                        src={imageSrc} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-stone-900 shadow-sm">
                        {tag}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-stone-900/0 to-stone-900/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}
                          className="w-full bg-white text-stone-900 font-bold py-3 rounded-xl hover:bg-stone-50 transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                    <div className="px-3 pb-3 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-stone-700">4.9</span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-lg leading-tight mb-2">{product.name}</h3>
                      </div>
                      <div className="font-black text-xl text-stone-900 mt-2">{formatINR(product.price)}</div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </main>

      {/* ── CART DRAWER ── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
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
                <h2 className="text-2xl font-black text-stone-900">Your Cart</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500 hover:text-stone-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-stone-500">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Your cart is empty.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 bg-stone-100 border border-stone-200 px-6 py-2 rounded-full hover:bg-stone-200 transition-colors font-semibold text-stone-900 cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map(item => {
                    const product = products.find(p => p.id === item.id)
                    if (!product) return null
                    const images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
                    const imageSrc = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
                    const colorOpt = COLOR_OPTIONS.find(c => c.name === item.color) || { priceMultiplier: 1.0 }
                    const adjustedPrice = Math.round(product.price * colorOpt.priceMultiplier)
                    const colorBadge = item.color !== 'Standard' ? ` (${item.color})` : ''

                    return (
                      <div key={`${item.id}-${item.color}`} className="flex gap-4">
                        <img src={imageSrc} className="w-24 h-24 rounded-xl object-cover bg-stone-100 flex-shrink-0" />
                        <div className="flex-1 py-1">
                          <h4 className="font-bold text-stone-900 text-sm leading-tight">{product.name}{colorBadge}</h4>
                          <div className="text-stone-900 font-black mt-1 text-sm">{formatINR(adjustedPrice)}</div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-3 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200">
                              <button 
                                onClick={() => updateCartQty(item.id, item.color, -1)}
                                className="text-stone-500 hover:text-stone-900 font-bold px-1.5 cursor-pointer text-xs"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-stone-900 w-4 text-center">{item.qty}</span>
                              <button 
                                onClick={() => updateCartQty(item.id, item.color, 1)}
                                className="text-stone-500 hover:text-stone-900 font-bold px-1.5 cursor-pointer text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-stone-50 border-t border-stone-200">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-stone-500 font-bold text-lg">Subtotal</span>
                    <span className="text-3xl font-black text-stone-900">{formatINR(cartTotal)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.setItem('dishdash_cart', JSON.stringify(cart));
                      window.location.href = '/checkout';
                    }}
                    className="w-full py-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-lg transition-all shadow-lg cursor-pointer"
                  >
                    Secure Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PRODUCT QUICK VIEW MODAL ── */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const images = typeof selectedProduct.images === 'string' ? JSON.parse(selectedProduct.images) : (selectedProduct.images || []);
          const activeImage = images[activeImageIndex] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
          const tag = selectedProduct.data?.tag || 'General';
          const subcategory = selectedProduct.data?.subcategory;
          const stock = Number(selectedProduct.data?.stock) || 0;
          
          const colorOpt = COLOR_OPTIONS.find(c => c.name === selectedColor) || { priceMultiplier: 1.0 };
          const adjustedPrice = Math.round(selectedProduct.price * colorOpt.priceMultiplier);

          return (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 z-50 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[90vh] overflow-y-auto"
              >
                {/* Header title on mobile */}
                <div className="md:col-span-12 flex justify-between items-center border-b border-stone-100 pb-3 md:hidden">
                  <h3 className="font-bold text-stone-900 text-lg">Product Details</h3>
                  <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-stone-100 rounded-full"><X className="w-5 h-5 text-stone-500" /></button>
                </div>

                {/* Left Side: Images */}
                <div className="md:col-span-6 space-y-4">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative flex items-center justify-center">
                    <img src={activeImage} className="w-full h-full object-cover" alt={selectedProduct.name} />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-stone-900 shadow-sm">
                      {tag}
                    </div>
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((url: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${activeImageIndex === index ? 'border-stone-900' : 'border-stone-200 hover:border-stone-400'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Info & Actions */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Header for desktop */}
                    <div className="hidden md:flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                          {subcategory ? `${tag} › ${subcategory}` : tag}
                        </span>
                        <h2 className="text-2xl font-black text-stone-900 leading-tight mt-1">{selectedProduct.name}</h2>
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-stone-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-stone-500" /></button>
                    </div>
                    
                    {/* Price and Stock status */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-stone-900">{formatINR(adjustedPrice)}</span>
                      {stock === 0 ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Out of Stock</span>
                      ) : stock <= 5 ? (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Low Stock ({stock})</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">In Stock</span>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-stone-400">Description</h4>
                      <p className="text-stone-600 text-sm leading-relaxed">
                        {selectedProduct.data?.description || "Experience the ultimate standard in design and reliability. This product features premium materials, meticulously crafted details, and top-tier performance for all daily uses."}
                      </p>
                    </div>

                    {/* Color Variation swatches */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-stone-400">Select Variant / Color</h4>
                      <div className="flex gap-3">
                        {COLOR_OPTIONS.map(opt => (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => setSelectedColor(opt.name)}
                            title={`${opt.name} (${opt.priceMultiplier > 1 ? `+${Math.round((opt.priceMultiplier - 1) * 100)}% price` : 'Standard Price'})`}
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${selectedColor === opt.name ? 'border-stone-900 scale-110 shadow-sm' : 'border-stone-200 hover:scale-105'}`}
                            style={{ backgroundColor: opt.hex }}
                          >
                            {selectedColor === opt.name && (
                              <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-400 font-semibold block">
                        Selected: <span className="text-stone-700 font-bold">{selectedColor}</span>
                        {colorOpt.priceMultiplier > 1 && ` (Premium finish +${Math.round((colorOpt.priceMultiplier - 1) * 100)}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart button with Quantity Selector */}
                  <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-stone-100 border border-stone-200 rounded-xl px-3 py-2">
                      <button 
                        type="button" 
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="text-stone-500 hover:text-stone-900 font-bold px-2 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-stone-900 w-5 text-center">{quantity}</span>
                      <button 
                        type="button" 
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="text-stone-500 hover:text-stone-900 font-bold px-2 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <button
                      disabled={stock === 0}
                      onClick={() => {
                        addToCart(selectedProduct.id, selectedColor, quantity);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-stone-200 mt-32 py-12 px-4 relative z-10">
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
  )
}
