'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { toast } from 'sonner';
import CheckoutForm from '@/components/customer/checkout/CheckoutForm';

export default function CaissePage() {
  const router = useRouter();
  const { cart, itemCount } = useCartStore();

  useEffect(() => {
    // Redirect if cart is empty
    if (!cart || itemCount === 0) {
      toast.error('Votre panier est vide');
      router.push('/boutique');
    }
  }, [cart, itemCount, router]);

  // Don't render if cart is empty
  if (!cart || itemCount === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <CheckoutForm />
    </div>
  );
}
