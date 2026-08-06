"use client";

import { useState } from 'react';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Account registered successfully!');
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-700 py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-stone-200 space-y-6">
        <div className="flex items-center justify-between">
          <a href="/login" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors font-bold text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </a>
          <span className="font-bold text-lg text-stone-900 select-none flex items-center gap-1">
            <div className="w-5 h-5 rounded-md bg-stone-900 flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            DishDash
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-black text-stone-900">Sign Up</h1>
          <p className="text-xs text-stone-400 mt-1">Register today and access standalone store credit purchase options.</p>
        </div>

        {error && (
          <div className="p-3 text-xs font-bold text-red-650 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Full Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yuvraj Arora"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-800 text-sm font-semibold transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yuvraj@arora.com"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-800 text-sm font-semibold transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Phone Number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 7889142708"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-800 text-sm font-semibold transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-800 text-sm font-semibold pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Confirm Password</label>
            <div className="relative">
              <input
                required
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-800 text-sm font-semibold pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-450 hover:text-stone-900 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-stone-400 pt-2 border-t border-stone-100">
          Already have an account? <a href="/login" className="text-stone-900 underline">Sign In</a>
        </div>
      </div>
    </div>
  );
}
