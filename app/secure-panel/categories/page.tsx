"use client"
import { FolderTree, Plus, Edit, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const categories = [
    { id: 1, name: 'Electronics', subcategories: ['Audio', 'Smart Home', 'Wearables'] },
    { id: 2, name: 'Daily Essentials', subcategories: ['Home', 'Kitchen', 'Lifestyle'] }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Category Management</h1>
          <p className="text-stone-500 text-sm">Organize your products with categories and subcategories.</p>
        </div>
        <button className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
          <Plus className="w-5 h-5" /> Add Category
        </button>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex text-xs font-bold uppercase tracking-wider text-stone-500">
          <div className="flex-1">Category Name</div>
          <div className="w-1/2">Subcategories</div>
          <div className="w-32 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-stone-100">
          {categories.map(cat => (
            <div key={cat.id} className="p-5 flex items-center hover:bg-stone-50 transition-colors group">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-900 border border-stone-200 shadow-sm">
                  <FolderTree className="w-5 h-5 text-stone-800" />
                </div>
                <span className="font-bold text-stone-900 text-base">{cat.name}</span>
              </div>
              <div className="w-1/2 flex flex-wrap gap-2 items-center">
                {cat.subcategories.map(sub => (
                  <span key={sub} className="px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-md text-xs font-bold text-stone-700">
                    {sub}
                  </span>
                ))}
                <button className="px-2.5 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="w-32 flex justify-end gap-2">
                <button className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
