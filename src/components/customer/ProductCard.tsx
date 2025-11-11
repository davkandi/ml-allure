'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import QuickViewModal from './QuickViewModal';

interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  stockQuantity: number;
  additionalPrice: number;
  isActive: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  images: string[];
  createdAt: Date | string;
  variants?: ProductVariant[];
}

interface ProductCardProps {
  product: Product & { 
    price?: number; // For backward compatibility
    variants?: ProductVariant[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  // Calculate if product is new (created within last 30 days)
  const isNew = () => {
    const createdDate = new Date(product.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate > thirtyDaysAgo;
  };

  // Check if all variants are out of stock
  const isOutOfStock = () => {
    if (!product.variants || product.variants.length === 0) return false;
    return product.variants.every(variant => variant.stockQuantity === 0);
  };

  // Calculate price or price range
  const getPriceDisplay = () => {
    const basePrice = product.basePrice || product.price || 0;
    
    if (!product.variants || product.variants.length === 0) {
      return `$${basePrice.toFixed(2)}`;
    }

    const prices = product.variants
      .filter(v => v.isActive)
      .map(v => basePrice + (v.additionalPrice || 0));
    
    if (prices.length === 0) {
      return `$${basePrice.toFixed(2)}`;
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)}`;
    }

    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  };

  const firstImage = product.images?.[0] || '/placeholder-product.jpg';
  const secondImage = product.images?.[1] || firstImage;

  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/customer/produits/${product.slug}`}>
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            {/* Main Image */}
            <Image
              src={firstImage}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-300"
              style={{ opacity: isHovered && secondImage !== firstImage ? 0 : 1 }}
            />
            
            {/* Second Image on Hover */}
            {secondImage !== firstImage && (
              <Image
                src={secondImage}
                alt={`${product.name} - vue 2`}
                fill
                className="object-cover transition-opacity duration-300"
                style={{ opacity: isHovered ? 1 : 0 }}
              />
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {isNew() && (
                <motion.span 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full shadow-md"
                >
                  Nouveau
                </motion.span>
              )}
              {isOutOfStock() && (
                <span className="bg-destructive text-white px-3 py-1 text-xs font-semibold rounded-full shadow-md">
                  Épuisé
                </span>
              )}
            </div>

            {/* Quick View Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0, 
                y: isHovered ? 0 : 20 
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-4 flex justify-center z-10"
            >
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setShowQuickView(true);
                }}
                variant="secondary"
                size="sm"
                className="shadow-lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Aperçu rapide
              </Button>
            </motion.div>

            {/* Hover Overlay */}
            <div 
              className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          <Link href={`/customer/produits/${product.slug}`}>
            <h3 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {getPriceDisplay()}
            </span>
          </div>
        </div>
      </Card>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        open={showQuickView}
        onOpenChange={setShowQuickView}
      />
    </>
  );
}