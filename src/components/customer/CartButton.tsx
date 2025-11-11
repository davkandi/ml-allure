'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/store/cartStore';
import ShoppingCartPanel from './ShoppingCart';
import { cn } from '@/lib/utils';

interface CartButtonProps {
  className?: string;
}

export default function CartButton({ className }: CartButtonProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { itemCount } = useCartStore();
  const [prevItemCount, setPrevItemCount] = useState(itemCount);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Detect when items are added to trigger animation
  useEffect(() => {
    if (itemCount > prevItemCount) {
      setShouldAnimate(true);
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
    setPrevItemCount(itemCount);
  }, [itemCount, prevItemCount]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', className)}
        onClick={() => setIsCartOpen(true)}
      >
        <motion.div
          animate={shouldAnimate ? {
            scale: [1, 1.2, 0.9, 1.1, 1],
            rotate: [0, -10, 10, -5, 0],
          } : {}}
          transition={{ duration: 0.6 }}
        >
          <ShoppingCart className="h-5 w-5" />
        </motion.div>

        {/* Item Count Badge with Animation */}
        <AnimatePresence mode="wait">
          {itemCount > 0 && (
            <motion.div
              key={itemCount}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 15 
              }}
              className="absolute -top-1 -right-1"
            >
              <Badge
                variant="destructive"
                className="h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
              >
                <motion.span
                  key={`count-${itemCount}`}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation Ring when Item Added */}
        {shouldAnimate && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </Button>

      {/* Shopping Cart Slide-over Panel */}
      <ShoppingCartPanel open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}