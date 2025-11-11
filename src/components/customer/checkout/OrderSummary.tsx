'use client';

import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/types';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export default function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  total,
}: OrderSummaryProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6">Récapitulatif de la commande</h3>

      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const itemPrice = item.product.salePrice || item.product.price;
          const itemTotal = itemPrice * item.quantity;

          return (
            <div key={item.id} className="flex gap-3">
              {/* Product Image */}
              <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                {item.product.images?.[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {/* Quantity Badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                  {item.quantity}
                </div>
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2 mb-1">
                  {item.product.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    ${itemPrice.toFixed(2)} × {item.quantity}
                  </span>
                  <span className="text-sm font-semibold">
                    ${itemTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Separator className="my-6" />

      {/* Price Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Frais de livraison</span>
          <span className="font-medium">
            {deliveryFee === 0 ? (
              <span className="text-green-600">Gratuit</span>
            ) : (
              `$${deliveryFee.toFixed(2)}`
            )}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          Les prix incluent toutes les taxes applicables
        </p>
      </div>
    </Card>
  );
}