"use client";

import { useState } from 'react';
import { ArrowLeft, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1); // 1 = enter email, 2 = enter otp + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch code');
      }

      setMessage(data.message || 'OTP code sent to email!');
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email, otp, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      alert('Password updated successfully! Please login with your new credentials.');
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
              <KeyRound className="w-3 h-3 text-white" />
            </div>
            DishDash
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-black text-stone-900">Reset Password</h1>
          <p className="text-xs text-stone-400 mt-1">
            {step === 1 
              ? 'Enter your account email to receive a 6-digit verification code.' 
              : 'Enter the code sent to your email and your new password.'
            }
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs font-bold text-red-650 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 text-xs font-bold text-emerald-650 bg-emerald-50 border border-emerald-200 rounded-xl">
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
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

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Verification Code</label>
              <input
                required
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none text-stone-800 text-sm font-semibold text-center tracking-widest font-mono transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">New Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs font-semibold text-stone-400 hover:text-stone-900 underline pt-2 cursor-pointer"
            >
              Resend code or edit email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
