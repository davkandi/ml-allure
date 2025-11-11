"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
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

interface VariantSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSelectVariant: (product: Product, variant: Variant) => void;
}

export function VariantSelectorModal({
  open,
  onOpenChange,
  product,
  onSelectVariant,
}: VariantSelectorModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  if (!product) return null;

  const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  const handleAdd = () => {
    if (selectedVariant) {
      onSelectVariant(product, selectedVariant);
      onOpenChange(false);
      setSelectedVariantId(null);
    }
  };

  // Group variants by size
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choisir une variante</DialogTitle>
          <DialogDescription>
            Sélectionnez la taille et la couleur souhaitées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex gap-4 pb-4 border-b">
            <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {firstImage ? (
                <Image
                  src={firstImage}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Package className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-xl">{product.name}</h3>
              <p className="text-2xl font-bold text-primary mt-2">
                ${product.basePrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Variants Grid */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">
              Variantes disponibles ({product.variants.length})
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {product.variants.map((variant) => {
                const isSelected = selectedVariantId === variant.id;
                const isOutOfStock = variant.stockQuantity === 0;
                const price = product.basePrice + (variant.additionalPrice || 0);

                return (
                  <button
                    key={variant.id}
                    onClick={() => !isOutOfStock && setSelectedVariantId(variant.id)}
                    disabled={isOutOfStock}
                    className={cn(
                      "p-4 border-2 rounded-lg text-left transition-all",
                      isSelected && "border-primary bg-primary/5",
                      !isSelected && !isOutOfStock && "border-border hover:border-primary/50",
                      isOutOfStock && "opacity-50 cursor-not-allowed bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                        <span className="font-semibold">{variant.size}</span>
                      </div>
                      {isOutOfStock ? (
                        <Badge variant="destructive" className="text-xs">
                          Rupture
                        </Badge>
                      ) : variant.stockQuantity <= 5 ? (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                          {variant.stockQuantity} restant{variant.stockQuantity > 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs bg-green-600">
                          En stock
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mb-1">
                      {variant.color}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        SKU: {variant.sku}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Variant Summary */}
          {selectedVariant && (
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Variante sélectionnée</p>
                  <p className="font-semibold">
                    {selectedVariant.size} - {selectedVariant.color}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Prix</p>
                  <p className="text-xl font-bold text-primary">
                    ${(product.basePrice + (selectedVariant.additionalPrice || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                onOpenChange(false);
                setSelectedVariantId(null);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              size="lg"
              onClick={handleAdd}
              disabled={!selectedVariantId}
              className="flex-1"
            >
              Ajouter au panier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}