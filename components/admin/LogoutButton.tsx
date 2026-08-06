"use client";

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/admin/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
    >
      <LogOut className="w-5 h-5" />
      {loading ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
