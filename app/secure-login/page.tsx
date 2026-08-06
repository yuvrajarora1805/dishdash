"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/secure-panel');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white border border-stone-200 shadow-2xl p-8 rounded-3xl max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-stone-900">DishDash Admin</h1>
          <p className="text-stone-500 mt-1 text-sm font-medium">Please sign in to access the control panel</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                required 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Enter username" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter password" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400" 
              />
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
