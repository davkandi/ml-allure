'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cartStore';
import { toast } from 'sonner';

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
  price?: number; // For backward compatibility
}

interface QuickViewModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  // Get unique sizes and colors from variants
  const availableSizes = product.variants
    ? Array.from(new Set(product.variants.filter(v => v.isActive && v.size).map(v => v.size)))
    : [];

  const availableColors = product.variants
    ? Array.from(
        new Map(
          product.variants
            .filter(v => v.isActive && v.color)
            .map(v => [v.color, { color: v.color!, colorHex: v.colorHex }])
        ).values()
      )
    : [];

  const [selectedSize, setSelectedSize] = useState<string | null>(
    availableSizes.length > 0 ? availableSizes[0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    availableColors.length > 0 ? availableColors[0].color : null
  );

  // Find matching variant based on selected options
  const findMatchingVariant = (size: string | null, color: string | null) => {
    if (!product.variants) return null;

    return product.variants.find(
      v =>
        v.isActive &&
        (size === null || v.size === size) &&
        (color === null || v.color === color)
    );
  };

  // Update selected variant when size or color changes
  useState(() => {
    const variant = findMatchingVariant(selectedSize, selectedColor);
    setSelectedVariant(variant || null);
  });

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variant = findMatchingVariant(size, selectedColor);
    setSelectedVariant(variant || null);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const variant = findMatchingVariant(selectedSize, color);
    setSelectedVariant(variant || null);
  };

  // Calculate final price
  const getFinalPrice = () => {
    const basePrice = product.basePrice || product.price || 0;
    const additionalPrice = selectedVariant?.additionalPrice || 0;
    return basePrice + additionalPrice;
  };

  // Check stock availability
  const getStockStatus = () => {
    if (!product.variants || product.variants.length === 0) {
      return { available: true, quantity: 999 };
    }

    if (!selectedVariant) {
      return { available: false, quantity: 0 };
    }

    return {
      available: selectedVariant.stockQuantity > 0,
      quantity: selectedVariant.stockQuantity,
    };
  };

  const stockStatus = getStockStatus();

  const handleAddToCart = () => {
    // Validate variant selection if product has variants
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast.error('Veuillez sélectionner une taille et une couleur');
      return;
    }

    // Check stock availability
    const stockStatus = getStockStatus();
    if (!stockStatus.available) {
      toast.error('Ce produit est en rupture de stock');
      return;
    }

    if (quantity > stockStatus.quantity) {
      toast.error(`Seulement ${stockStatus.quantity} article(s) disponible(s)`);
      return;
    }

    // Add item to cart
    const cartItem = {
      id: Date.now(), // Temporary ID
      cartId: 0,
      productId: product.id,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.basePrice || product.price || 0,
        salePrice: getFinalPrice(),
        sku: selectedVariant?.sku || `PROD-${product.id}`,
        stock: stockStatus.quantity,
        images: product.images,
        featured: false,
        categoryId: 0,
        createdAt: product.createdAt,
        updatedAt: new Date(),
      },
      quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addItem(cartItem);
    toast.success('Produit ajouté au panier', {
      description: `${quantity} x ${product.name}`,
    });
    
    // Close modal and reset
    onOpenChange(false);
    setQuantity(1);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          {product.description && (
            <DialogDescription>{product.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <Image
                    src={product.images[selectedImageIndex] || '/placeholder-product.jpg'}
                    alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                      selectedImageIndex === index
                        ? 'border-primary shadow-md'
                        : 'border-transparent hover:border-muted-foreground/30'
                    )}
                  >
                    <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Price */}
            <div>
              <span className="text-3xl font-bold text-primary">
                ${getFinalPrice().toFixed(2)}
              </span>
            </div>

            {/* Stock Status */}
            <div>
              {stockStatus.available ? (
                <span className="text-sm text-green-600 font-medium">
                  En stock ({stockStatus.quantity} disponible{stockStatus.quantity > 1 ? 's' : ''})
                </span>
              ) : (
                <span className="text-sm text-destructive font-medium">Rupture de stock</span>
              )}
            </div>

            {/* Size Selector */}
            {availableSizes.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Taille: {selectedSize && <span className="text-primary">{selectedSize}</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSizeSelect(size)}
                      className="min-w-[60px]"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {availableColors.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Couleur: {selectedColor && <span className="text-primary">{selectedColor}</span>}
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map(({ color, colorHex }) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={cn(
                        'relative w-10 h-10 rounded-full border-2 transition-all',
                        selectedColor === color
                          ? 'border-primary shadow-md scale-110'
                          : 'border-muted-foreground/30 hover:border-muted-foreground'
                      )}
                      title={color}
                    >
                      <div
                        className="w-full h-full rounded-full"
                        style={{ backgroundColor: colorHex || '#cccccc' }}
                      />
                      {selectedColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Quantité</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(stockStatus.quantity, quantity + 1))}
                  disabled={quantity >= stockStatus.quantity}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={!stockStatus.available || (product.variants && !selectedVariant)}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier
              </Button>

              <Link href={`/customer/produits/${product.slug}`} onClick={() => onOpenChange(false)}>
                <Button variant="outline" size="lg" className="w-full">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Voir les détails
                </Button>
              </Link>
            </div>

            {/* Additional Info */}
            {product.description && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}