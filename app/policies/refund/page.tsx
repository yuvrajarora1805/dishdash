import { ArrowLeft } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-700 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200">
        <a href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-bold text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </a>
        
        <h1 className="text-4xl font-black text-stone-900 mb-2">Refund Policy</h1>
        <p className="text-sm text-stone-400 mb-8">Last Updated: August 6, 2026</p>
        
        <div className="space-y-6 text-sm leading-relaxed text-stone-600">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">1. Eligibility for Refunds</h2>
            <p>
              Since DishDash is configured as a single-tenant workspace storefront with mock gateways and credit verification scripts, orders processed on this site do not involve real physical transport or real currency transfers unless configured explicitly with a live merchant profile.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">2. Replacement & Defect Policy</h2>
            <p>
              We maintain a 10-day simulator replacement policy for code verification. If your mock order status is marked as rejected, a refund or credit assignment will be instantly simulated inside the POS admin orders database.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">3. Cancellation Details</h2>
            <p>
              Orders can be deleted or updated in the Admin panel orders list prior to payment confirmation signatures. Once the order status is updated to "Delivered", modifications are permanently frozen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
