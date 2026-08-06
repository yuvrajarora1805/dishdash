"use client"

import { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit2, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'subcategory'>('category');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string, name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Network error: Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const openAddCategoryModal = () => {
    setModalType('category');
    setSelectedParentId(null);
    setEditingItem(null);
    setInputValue('');
    setIsModalOpen(true);
  };

  const openAddSubcategoryModal = (parentId: string) => {
    setModalType('subcategory');
    setSelectedParentId(parentId);
    setEditingItem(null);
    setInputValue('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: { id: string, name: string }) => {
    setEditingItem(item);
    setInputValue(item.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      if (editingItem) {
        // Edit Operation
        const res = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, name: inputValue.trim() })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsModalOpen(false);
          fetchCategories();
        } else {
          setError(data.error || 'Failed to update item');
        }
      } else {
        // Add Operation
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: inputValue.trim(),
            parent_id: selectedParentId
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsModalOpen(false);
          fetchCategories();
        } else {
          setError(data.error || 'Failed to save item');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? If it is a parent category, all its subcategories will also be deleted.`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCategories();
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (err) {
      alert('Network error. Failed to delete.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-4 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Category Management</h1>
          <p className="text-stone-500 text-xs sm:text-sm">Organize your products with custom categories and subcategories.</p>
        </div>
        <button 
          onClick={openAddCategoryModal}
          className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-200 shadow-sm rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-stone-900 mb-3" />
          <p className="text-sm font-semibold text-stone-500">Loading custom categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 shadow-sm rounded-2xl">
          <FolderTree className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">No custom categories found.</p>
          <p className="text-xs text-stone-400 mt-1">Add categories to organize your store inventory.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white border border-stone-200 shadow-sm rounded-2xl p-4 sm:p-5 space-y-4">
              {/* Parent Category Row */}
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-850 border border-stone-200 shrink-0">
                    <FolderTree className="w-4 h-4 sm:w-5 sm:h-5 text-stone-850" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-base sm:text-lg truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button 
                    onClick={() => openEditModal({ id: cat.id, name: cat.name })}
                    className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subcategories Container */}
              <div className="space-y-2.5">
                <div className="text-[10px] uppercase font-black text-stone-400 tracking-wider">Subcategories</div>
                <div className="flex flex-wrap gap-2 items-center">
                  {cat.subcategories.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      className="inline-flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg pl-3 pr-1.5 py-1 text-xs font-bold text-stone-800"
                    >
                      <span className="truncate max-w-[120px] sm:max-w-none">{sub.name}</span>
                      <button 
                        onClick={() => openEditModal({ id: sub.id, name: sub.name })}
                        className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="p-1 hover:bg-red-100 rounded text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => openAddSubcategoryModal(cat.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-black transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Add Sub
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 z-50 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-lg font-black text-stone-900">
                  {editingItem ? 'Rename Item' : modalType === 'category' ? 'Add New Category' : 'Add New Subcategory'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    {modalType === 'category' ? 'Category Name' : 'Subcategory Name'}
                  </label>
                  <input
                    required
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={modalType === 'category' ? 'e.g. Appliances' : 'e.g. Blenders'}
                    className="w-full bg-stone-50 border border-stone-250 rounded-xl px-4 py-3 text-stone-900 text-sm font-semibold outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    type="submit"
                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingItem ? (
                      'Update'
                    ) : (
                      'Save'
                    )}
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
