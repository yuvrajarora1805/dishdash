"use client"

import { useState, useEffect } from 'react';
import { formatINR } from '@/lib/utils';
import { Plus, Search, Tag, Image as ImageIcon, Pencil, Trash2, X, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_MAP: Record<string, string[]> = {
  'Electronics': ['Audio', 'Smart Home', 'Wearables'],
  'Daily Essentials': ['Home', 'Kitchen', 'Lifestyle']
};

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tag, setTag] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('Audio');
  const [isTrending, setIsTrending] = useState(false);
  const [stock, setStock] = useState('');
  const [variants, setVariants] = useState<{name: string, hex: string, priceMultiplier: number}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleTagChange = (newTag: string) => {
    setTag(newTag);
    const foundCat = dbCategories.find(c => c.name === newTag);
    const subs = foundCat ? foundCat.subcategories.map((s: any) => s.name) : (CATEGORY_MAP[newTag] || []);
    setSubcategory(subs[0] || '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImages(prev => [...prev, ...data.urls]);
      } else {
        alert(data.error || 'Failed to upload files');
      }
    } catch (err) {
      alert('Upload failed due to network error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  useEffect(() => {
    fetchProducts();
    fetchDbCategories();
  }, []);

  const fetchDbCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setDbCategories(data);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?tenantId=dishdash-solo');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setImages([]);
    const defaultTag = dbCategories[0]?.name || 'Electronics';
    const defaultSub = dbCategories[0]?.subcategories?.[0]?.name || 'Audio';
    setTag(defaultTag);
    setSubcategory(defaultSub);
    setIsTrending(true);
    setStock('0');
    setVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(String(p.price));
    setImages(p.images || []);
    
    // Map legacy tags to new categories
    const rawTag = p.data?.tag || 'Electronics';
    let mappedTag = rawTag;
    if (rawTag === 'Tech') {
      mappedTag = 'Electronics';
    } else if (['Home', 'Lifestyle', 'Kitchen', 'General'].includes(rawTag)) {
      mappedTag = 'Daily Essentials';
    }
    
    const foundCat = dbCategories.find(c => c.name === mappedTag);
    const subs = foundCat ? foundCat.subcategories.map((s: any) => s.name) : (CATEGORY_MAP[mappedTag] || []);
    const subVal = subs.includes(rawTag) ? rawTag : (p.data?.subcategory || subs[0] || '');
    
    setTag(mappedTag);
    setSubcategory(subVal);
    setIsTrending(!!p.data?.is_trending);
    setStock(String(p.data?.stock || '0'));
    setVariants(p.data?.variants || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setSubmitting(true);

    const payload = {
      id: editingProduct?.id,
      name,
      price: Number(price),
      images: images,
      tag,
      subcategory,
      is_trending: isTrending,
      stock: Number(stock),
      variants
    };

    try {
      const res = await fetch('/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchProducts();
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.data?.tag || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-1">Products</h1>
          <p className="text-stone-500">Manage your inventory and catalog.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -transtone-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 transition-colors"
            />
          </div>
          <div className="text-sm font-bold text-stone-500">{filteredProducts.length} Products</div>
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
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Category / Tag</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Trending</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-500">No products found.</td>
                  </tr>
                ) : (
                  filteredProducts.map((product: any) => {
                    const imageSrc = product.images?.[0];
                    const tag = product.data?.tag || 'General';
                    const trending = !!product.data?.is_trending;
                    const stockVal = Number(product.data?.stock) || 0;
                    
                    return (
                      <tr key={product.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-stone-200">
                              {imageSrc ? (
                                <img src={imageSrc} className="w-full h-full object-cover" alt={product.name} />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-stone-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-stone-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-black text-stone-900">{formatINR(product.price)}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-md text-xs font-bold">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                            {product.data?.subcategory && (
                              <span className="inline-flex items-center bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[10px] font-bold">
                                {product.data.subcategory}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {stockVal === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-red-700 bg-red-100 border border-red-200">
                              Out of Stock
                            </span>
                          ) : stockVal <= 5 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200">
                              Low Stock ({stockVal})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200">
                              In Stock ({stockVal})
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${trending ? 'text-amber-700 bg-amber-100 border border-amber-200' : 'text-stone-500 bg-stone-100 border border-stone-200'}`}>
                            {trending ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => openEditModal(product)}
                              className="p-1 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Product Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 z-50 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-xl font-bold text-stone-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-950"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Side: Product Details */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 uppercase">Product Name</label>
                    <input 
                      required 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="e.g. Mechanical Keyboard"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 outline-none focus:border-stone-900 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 uppercase">Price (INR)</label>
                      <input 
                        required 
                        type="number" 
                        value={price} 
                        onChange={e => setPrice(e.target.value)} 
                        placeholder="e.g. 14900"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 outline-none focus:border-stone-900 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 uppercase">Stock Quantity</label>
                      <input 
                        required 
                        type="number" 
                        value={stock} 
                        onChange={e => setStock(e.target.value)} 
                        placeholder="e.g. 50"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 outline-none focus:border-stone-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 uppercase">Category Tag</label>
                      <select 
                        value={tag} 
                        onChange={e => handleTagChange(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 outline-none focus:border-stone-900 transition-colors"
                      >
                        {dbCategories.length > 0 ? (
                          dbCategories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="Electronics">Electronics</option>
                            <option value="Daily Essentials">Daily Essentials</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 uppercase">Subcategory</label>
                      <select 
                        value={subcategory} 
                        onChange={e => setSubcategory(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 outline-none focus:border-stone-900 transition-colors"
                      >
                        {(() => {
                          const foundCat = dbCategories.find(c => c.name === tag);
                          const subs = foundCat ? foundCat.subcategories.map((s: any) => s.name) : (CATEGORY_MAP[tag] || []);
                          return subs.map((sub: string) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isTrending" 
                      checked={isTrending} 
                      onChange={e => setIsTrending(e.target.checked)}
                      className="rounded text-stone-900 focus:ring-stone-900 animate-none"
                    />
                    <label htmlFor="isTrending" className="text-sm font-semibold text-stone-700 select-none">Show in Trending Section on Homepage</label>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-200">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Product Variants</label>
                    <div className="space-y-2">
                      {variants.map((v, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
                          <input
                            type="text"
                            placeholder="Name (e.g. Red)"
                            value={v.name}
                            onChange={(e) => {
                              const newV = [...variants];
                              newV[idx].name = e.target.value;
                              setVariants(newV);
                            }}
                            className="flex-1 bg-white border border-stone-200 rounded px-2 py-1 text-sm outline-none"
                          />
                          <input
                            type="color"
                            value={v.hex}
                            onChange={(e) => {
                              const newV = [...variants];
                              newV[idx].hex = e.target.value;
                              setVariants(newV);
                            }}
                            className="w-8 h-8 rounded border-none cursor-pointer p-0"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Multiplier"
                            value={v.priceMultiplier}
                            onChange={(e) => {
                              const newV = [...variants];
                              newV[idx].priceMultiplier = Number(e.target.value);
                              setVariants(newV);
                            }}
                            className="w-20 bg-white border border-stone-200 rounded px-2 py-1 text-sm outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVariants([...variants, { name: 'Standard', hex: '#000000', priceMultiplier: 1.0 }])}
                        className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        + Add Variant
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Side: Images Upload */}
                <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Product Images</label>
                    
                    {/* Upload Controls */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Gallery Upload */}
                      <label className="bg-stone-100 border border-stone-200 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-stone-200/50 transition-colors flex flex-col items-center justify-center gap-1.5 min-h-[105px]">
                        <ImageIcon className="w-5 h-5 text-stone-500 animate-none" />
                        <span className="text-xs font-bold text-stone-600">
                          {uploading ? 'Uploading...' : 'Upload Gallery'}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={uploading}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Camera Capture */}
                      <label className="bg-stone-100 border border-stone-200 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-stone-200/50 transition-colors flex flex-col items-center justify-center gap-1.5 min-h-[105px]">
                        <Camera className="w-5 h-5 text-stone-500 animate-none" />
                        <span className="text-xs font-bold text-stone-600">
                          {uploading ? 'Uploading...' : 'Take Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          disabled={uploading}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Thumbnail Previews */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 border border-stone-100 p-2.5 rounded-xl bg-stone-50 max-h-[160px] overflow-y-auto">
                        {images.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 group bg-white">
                            <img src={url} className="w-full h-full object-cover" alt="product preview" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black transition-opacity cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="md:col-span-12 border-t border-stone-100 pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={submitting} 
                    type="submit" 
                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
