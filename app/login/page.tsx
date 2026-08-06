"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamically load Google Identity Services SDK script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: '628375430211-aq8gbjeag8obgb9dt4ml48etdtqll4l0.apps.googleusercontent.com', // Google Public App Client ID
          callback: handleGoogleCredential
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: 384, text: 'signin_with' }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleCredential = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Login failed');
      }
      localStorage.setItem('dishdash_customer', JSON.stringify(data.customer));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save customer data in localStorage for fast UI rendering
      localStorage.setItem('dishdash_customer', JSON.stringify(data.customer));
      window.location.href = '/';
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
          <a href="/" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors font-bold text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Store
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
          <h1 className="text-3xl font-black text-stone-900">Sign In</h1>
          <p className="text-xs text-stone-400 mt-1">Access your customer profile & view order histories.</p>
        </div>

        {error && (
          <div className="p-3 text-xs font-bold text-red-650 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Password</label>
              <a href="/forgot-password" className="text-[10px] font-bold text-stone-500 hover:text-stone-900 underline">Forgot?</a>
            </div>
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

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center text-xs font-bold text-stone-300 uppercase tracking-widest">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-4 text-stone-400 select-none">or</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* Google Sign-in Container */}
        <div id="google-signin-btn" className="w-full flex justify-center py-1" />

        <div className="text-center text-xs font-semibold text-stone-400 pt-2 border-t border-stone-100">
          New to DishDash? <a href="/register" className="text-stone-900 underline">Create an Account</a>
        </div>
      </div>
    </div>
  );
}
