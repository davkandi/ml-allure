import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem } from '@/types';

interface CartState {
  cart: Cart | null;
  itemCount: number;
  total: number;
  setCart: (cart: Cart) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  calculateTotal: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      itemCount: 0,
      total: 0,
      setCart: (cart) => {
        set({ cart });
        get().calculateTotal();
      },
      addItem: (item) => {
        const cart = get().cart;
        if (cart) {
          const existingItem = cart.items.find((i) => i.productId === item.productId);
          if (existingItem) {
            get().updateQuantity(existingItem.id, existingItem.quantity + item.quantity);
          } else {
            set({ cart: { ...cart, items: [...cart.items, item] } });
            get().calculateTotal();
          }
        } else {
          // Create new cart if none exists
          const newCart: Cart = {
            id: Date.now(),
            userId: 0,
            items: [item],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          set({ cart: newCart });
          get().calculateTotal();
        }
      },
      removeItem: (itemId) => {
        const cart = get().cart;
        if (cart) {
          set({ cart: { ...cart, items: cart.items.filter((i) => i.id !== itemId) } });
          get().calculateTotal();
        }
      },
      updateQuantity: (itemId, quantity) => {
        const cart = get().cart;
        if (cart) {
          set({
            cart: {
              ...cart,
              items: cart.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
            },
          });
          get().calculateTotal();
        }
      },
      clearCart: () => {
        set({ cart: null, itemCount: 0, total: 0 });
      },
      calculateTotal: () => {
        const cart = get().cart;
        if (cart) {
          const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          const total = cart.items.reduce(
            (sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity,
            0
          );
          set({ itemCount, total });
        } else {
          set({ itemCount: 0, total: 0 });
        }
      },
    }),
    {
      name: 'ml-allure-cart',
    }
  )
);