import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products?slug=${slug}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

async function getProductVariants(productId: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/product-variants?productId=${productId}&isActive=true`, {
      cache: 'no-store'
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error fetching variants:', error);
    return [];
  }
}

async function getRelatedProducts(categoryId: number, currentProductId: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(
      `${baseUrl}/api/products?categoryId=${categoryId}&isActive=true&limit=6`,
      { cache: 'no-store' }
    );
    
    if (!res.ok) return [];
    const products = await res.json();
    return products.filter((p: any) => p.id !== currentProductId);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const [variants, relatedProducts] = await Promise.all([
    getProductVariants(product.id),
    product.categoryId ? getRelatedProducts(product.categoryId, product.id) : []
  ]);

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ProductDetailClient 
        product={product} 
        variants={variants}
        relatedProducts={relatedProducts}
      />
    </Suspense>
  );
}
