import { notFound } from 'next/navigation';
import { dbGet, ensureDbReady } from '@/lib/db';
import ProductDetailClient from '@/components/storefront/ProductDetailClient';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  await ensureDbReady();
  
  // Resolve params dynamically (Next.js 15+ compatible)
  const resolvedParams = typeof (params as any).then === 'function' ? await params : params;
  const id = (resolvedParams as any)?.id;
  
  if (!id) {
    return notFound();
  }
  
  const product = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
  
  if (!product) {
    return notFound();
  }

  // Parse JSON properties for safe prop serialization
  const parsedProduct = {
    ...product,
    images: product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [],
    data: product.data ? (typeof product.data === 'string' ? JSON.parse(product.data) : product.data) : {}
  };

  return <ProductDetailClient product={parsedProduct} />;
}
