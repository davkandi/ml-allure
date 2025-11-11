"use client";

import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Variant {
  id: number;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stockQuantity: number;
  additionalPrice: number;
}

interface Product {
  id: number;
  name: string;
  basePrice: number;
  images: string[] | null;
  variants: Variant[];
}

interface POSProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variant: Variant) => void;
  onShowVariants: (product: Product) => void;
}

export function POSProductCard({
  product,
  onAddToCart,
  onShowVariants,
}: POSProductCardProps) {
  const totalStock = product.variants.reduce(
    (sum, v) => sum + v.stockQuantity,
    0
  );
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const hasMultipleVariants = product.variants.length > 1;

  const handleClick = () => {
    if (hasMultipleVariants) {
      onShowVariants(product);
    } else if (product.variants.length === 1) {
      const variant = product.variants[0];
      if (variant.stockQuantity > 0) {
        onAddToCart(product, variant);
      }
    }
  };

  return (
    <Card
      className="relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={handleClick}
    >
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            width={300}
            height={300}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
          />
        ) : (
          <Package className="h-20 w-20 text-muted-foreground" />
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {product.name}
          </h3>
          {totalStock <= 5 && totalStock > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-600 shrink-0">
              {totalStock} restant{totalStock > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">
            ${product.basePrice.toFixed(2)}
          </div>
          
          {totalStock > 0 ? (
            <Badge variant="default" className="bg-green-600">
              En stock
            </Badge>
          ) : (
            <Badge variant="destructive">
              Rupture
            </Badge>
          )}
        </div>

        {hasMultipleVariants && (
          <div className="text-sm text-muted-foreground">
            {product.variants.length} variants disponibles
          </div>
        )}

        <Button
          size="lg"
          className="w-full text-base"
          disabled={totalStock === 0}
        >
          {hasMultipleVariants ? "Choisir une variante" : "Ajouter au panier"}
        </Button>
      </div>
    </Card>
  );
}