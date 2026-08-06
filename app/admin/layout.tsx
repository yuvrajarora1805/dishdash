import { Package, Users, Settings, LayoutDashboard, ShoppingBag, FolderTree, Store, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/admin/LogoutButton';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-stone-50 text-stone-600">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col shadow-sm z-10">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <div className="w-8 h-8 bg-stone-900 rounded flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            DishDash <span className="font-light text-stone-500">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-stone-100 text-stone-900 font-medium">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
            <Package className="w-5 h-5" /> Products
          </Link>
          <Link href="/admin/categories" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
            <FolderTree className="w-5 h-5" /> Categories
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
            <ShoppingBag className="w-5 h-5" /> Orders
          </Link>
          <Link href="/admin/customers" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
            <Users className="w-5 h-5" /> Customers & Credit
          </Link>
          <Link href="/admin/pos" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
            <Store className="w-5 h-5" /> Point of Sale
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
            <BarChart3 className="w-5 h-5" /> Analytics
          </Link>
        </nav>
        <div className="p-4 border-t border-stone-200 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </button>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
