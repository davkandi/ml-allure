import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  variantId: number;
  productName: string;
  variantDetails: {
    size: string;
    color: string;
    sku: string;
  };
  price: number;
  quantity: number;
  image?: string;
}

interface POSStore {
  cart: CartItem[];
  currentUser: {
    id: number;
    name: string;
    role: string;
  } | null;
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  
  // User actions
  setCurrentUser: (user: { id: number; name: string; role: string }) => void;
  clearCurrentUser: () => void;
  
  // Computed values
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      cart: [],
      currentUser: null,

      addToCart: (item) => {
        set((state) => {
          const existingItem = state.cart.find(
            (i) => i.variantId === item.variantId
          );

          if (existingItem) {
            return {
              cart: state.cart.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }

          return {
            cart: [...state.cart, { ...item, quantity: 1 }],
          };
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(variantId);
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        }));
      },

      removeFromCart: (variantId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.variantId !== variantId),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      clearCurrentUser: () => {
        set({ currentUser: null });
      },

      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'pos-storage',
    }
  )
);
