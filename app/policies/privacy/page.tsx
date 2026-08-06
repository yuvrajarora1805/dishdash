import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-700 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200">
        <a href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-bold text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </a>
        
        <h1 className="text-4xl font-black text-stone-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-stone-400 mb-8">Last Updated: August 6, 2026</p>
        
        <div className="space-y-6 text-sm leading-relaxed text-stone-600">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">1. Information Collection</h2>
            <p>
              We collect minimal information necessary to process mock orders on this standalone storefront. This includes name, phone number, delivery address, and order item selections. We do not persist credit card codes or sensitive banking passwords.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">2. Local Storage Usage</h2>
            <p>
              To optimize navigation, items added to your checkout basket are cached inside your browser's local storage database (`dishdash_cart`). Clearing browser data will automatically empty the active cart.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">3. Third-Party API Modules</h2>
            <p>
              Hashing utilities communicate securely with the PayU processing engine to negotiate testing callbacks. No information is sold, rented, or distributed to advertising networks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">4. Security Measures</h2>
            <p>
              All administrator panels and endpoints are protected by secure Edge Web Cryptography HMAC session tokens. Unauthorized login attempts are automatically logged and rejected.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
