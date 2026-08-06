import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-700 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200">
        <a href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-bold text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </a>
        
        <h1 className="text-4xl font-black text-stone-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-stone-400 mb-8">Last Updated: August 6, 2026</p>
        
        <div className="space-y-6 text-sm leading-relaxed text-stone-600">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">1. Acceptance of Terms</h2>
            <p>
              By accessing and placing an order with DishDash, you confirm that you are in agreement with and bound by the terms of service contained in the Terms and Conditions outlined below. These terms apply to the entire website and any email or other type of communication between you and DishDash.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">2. Single-Tenant Transactions</h2>
            <p>
              All products, services, and processing are provided strictly for standalone checkout verification. The purchase receipt generated represents a simulated transactional flow designed for quality audits and secure digital validation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">3. Payment & Billing</h2>
            <p>
              By providing credit card, UPI, or cash details during checkout, you authorize our processing modules (including card verification tests and PayU sandbox systems) to validate authorization status. All credentials are processed securely using edge cryptographic utilities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">4. Liability Limitation</h2>
            <p>
              DishDash and its engineering affiliates shall not be liable for any direct, indirect, incidental, or consequential damages resulting from transaction interruptions or data entry discrepancies on storefront checkout panels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
