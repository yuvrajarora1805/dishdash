"use client"

import { useState } from 'react';
import { Package, Users, Settings, LayoutDashboard, ShoppingBag, FolderTree, Store, BarChart3, DollarSign, Menu, X } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/admin/LogoutButton';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/secure-panel', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/secure-panel/products', label: 'Products', icon: Package },
    { href: '/secure-panel/categories', label: 'Categories', icon: FolderTree },
    { href: '/secure-panel/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/secure-panel/customers', label: 'Customers & Credit', icon: Users },
    { href: '/secure-panel/khata', label: 'Pending Khata', icon: DollarSign },
    { href: '/secure-panel/pos', label: 'Point of Sale', icon: Store },
    { href: '/secure-panel/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-stone-50 text-stone-600 overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-stone-200 flex-col shadow-sm shrink-0">
        <div className="p-6">
          <Link href="/secure-panel" className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <div className="w-8 h-8 bg-stone-900 rounded flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            DishDash <span className="font-light text-stone-500">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-semibold text-sm ${
                  isActive 
                    ? 'bg-stone-900 text-white shadow-sm' 
                    : 'hover:bg-stone-50 text-stone-600 hover:text-stone-900'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-stone-200 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors font-semibold text-sm">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Drawer (Visible only when open) */}
      <div className={`fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 transition-opacity lg:hidden ${
        isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-stone-200 flex flex-col shadow-2xl z-50 transition-transform lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 flex items-center justify-between border-b border-stone-100">
          <Link href="/secure-panel" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 text-lg font-bold text-stone-900">
            <div className="w-7 h-7 bg-stone-900 rounded flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4 text-white" />
            </div>
            DishDash <span className="font-light text-stone-500">Admin</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-stone-150 rounded-full text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-semibold text-sm ${
                  isActive 
                    ? 'bg-stone-900 text-white shadow-sm' 
                    : 'hover:bg-stone-50 text-stone-600 hover:text-stone-900'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-stone-100 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors font-semibold text-sm">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar on Mobile */}
        <header className="lg:hidden h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 z-20 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-extrabold text-stone-900 text-base tracking-tight select-none">
            DishDash Admin
          </div>
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-700">
            A
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-stone-50">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
