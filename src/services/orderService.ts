import api from '@/lib/api';
import { Order } from '@/types';

export const orderService = {
  getAll: async (): Promise<{ orders: Order[] }> => {
    const response = await api.get<{ orders: Order[] }>('/orders');
    return response.data;
  },

  getById: async (id: number): Promise<{ order: Order }> => {
    const response = await api.get<{ order: Order }>(`/orders/${id}`);
    return response.data;
  },

  create: async (data: {
    addressId: number;
    items: Array<{ productId: number; quantity: number; price: number }>;
    subtotal: number;
    tax: number;
    shipping: number;
    notes?: string;
  }): Promise<{ order: Order }> => {
    const response = await api.post<{ order: Order }>('/orders', data);
    return response.data;
  },

  update: async (
    id: number,
    data: { status?: string; paymentStatus?: string }
  ): Promise<{ order: Order }> => {
    const response = await api.put<{ order: Order }>(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};
