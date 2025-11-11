'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCartStore } from '@/lib/store/cartStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShoppingCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShoppingCart({ open, onOpenChange }: ShoppingCartProps) {
  const router = useRouter();
  const { cart, itemCount, total, updateQuantity, removeItem } = useCartStore();
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItemId(itemId);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      updateQuantity(itemId, newQuantity);
      toast.success('Quantité mise à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setItemToRemove(itemId);
    setShowRemoveDialog(true);
  };

  const confirmRemoveItem = async () => {
    if (itemToRemove === null) return;
    
    setRemovingItemId(itemToRemove);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      removeItem(itemToRemove);
      toast.success('Article retiré du panier');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setRemovingItemId(null);
      setShowRemoveDialog(false);
      setItemToRemove(null);
    }
  };

  const handleCheckout = () => {
    // Validate stock before checkout
    if (!cart || cart.items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    // Check if any items are out of stock
    const outOfStockItems = cart.items.filter(
      item => item.product.stock < item.quantity
    );

    if (outOfStockItems.length > 0) {
      toast.error(
        `Certains articles n'ont plus de stock suffisant: ${outOfStockItems
          .map(item => item.product.name)
          .join(', ')}`
      );
      return;
    }

    // Navigate to checkout
    onOpenChange(false);
    router.push('/caisse');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-2xl">Panier</SheetTitle>
                <SheetDescription>
                  {itemCount} article{itemCount > 1 ? 's' : ''}
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!cart || cart.items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Votre panier est vide</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Découvrez nos produits et ajoutez vos articles préférés
                </p>
                <Button onClick={() => onOpenChange(false)} asChild>
                  <Link href="/boutique">
                    Continuer vos achats
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {cart.items.map((item, index) => {
                    const itemPrice = item.product.salePrice || item.product.price;
                    const itemSubtotal = itemPrice * item.quantity;
                    const isUpdating = updatingItemId === item.id;
                    const isRemoving = removingItemId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'flex gap-4 p-4 rounded-lg border bg-card transition-all',
                          (isUpdating || isRemoving) && 'opacity-50'
                        )}
                      >
                        {/* Product Image */}
                        <Link
                          href={`/produits/${item.product.slug}`}
                          className="relative w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0 group"
                          onClick={() => onOpenChange(false)}
                        >
                          {item.product.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/produits/${item.product.slug}`}
                            onClick={() => onOpenChange(false)}
                            className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors mb-1"
                          >
                            {item.product.name}
                          </Link>

                          {/* Variant Info */}
                          <div className="text-xs text-muted-foreground mb-2">
                            SKU: {item.product.sku}
                          </div>

                          {/* Price per unit */}
                          <div className="text-sm font-semibold text-primary mb-3">
                            ${itemPrice.toFixed(2)}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isUpdating}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-10 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={
                                  item.quantity >= item.product.stock || isUpdating
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Subtotal */}
                            <span className="text-sm font-bold ml-auto">
                              ${itemSubtotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Stock Warning */}
                          {item.quantity >= item.product.stock && (
                            <p className="text-xs text-destructive mt-2">
                              Stock limité: {item.product.stock} disponible{item.product.stock > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isRemoving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="border-t bg-background p-6 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Sous-total:</span>
                <span className="font-bold text-primary text-xl">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Note */}
              <p className="text-xs text-muted-foreground text-center">
                Frais de livraison calculés à la caisse
              </p>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full text-base font-semibold"
                  onClick={handleCheckout}
                >
                  Passer à la caisse
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link href="/boutique">Continuer vos achats</Link>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cet article?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer cet article de votre panier? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveItem}
              className="bg-destructive hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}