import api from '@/lib/api';
import { Cart, CartItem } from '@/types';

export const cartService = {
  get: async (): Promise<{ cart: Cart }> => {
    const response = await api.get<{ cart: Cart }>('/cart');
    return response.data;
  },

  addItem: async (productId: number, quantity: number): Promise<{ cartItem: CartItem }> => {
    const response = await api.post<{ cartItem: CartItem }>('/cart/items', {
      productId,
      quantity,
    });
    return response.data;
  },

  updateItem: async (id: number, quantity: number): Promise<{ cartItem: CartItem }> => {
    const response = await api.put<{ cartItem: CartItem }>(`/cart/items/${id}`, { quantity });
    return response.data;
  },

  removeItem: async (id: number): Promise<void> => {
    await api.delete(`/cart/items/${id}`);
  },

  clear: async (): Promise<void> => {
    await api.delete('/cart');
  },
};
