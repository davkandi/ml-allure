import api from '@/lib/api';
import { Product } from '@/types';
import { ProductInput } from '@/lib/utils/validation';

export const productService = {
  getAll: async (params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }): Promise<{ products: Product[] }> => {
    const response = await api.get<{ products: Product[] }>('/products', { params });
    return response.data;
  },

  getById: async (id: number): Promise<{ product: Product }> => {
    const response = await api.get<{ product: Product }>(`/products/${id}`);
    return response.data;
  },

  create: async (data: ProductInput): Promise<{ product: Product }> => {
    const response = await api.post<{ product: Product }>('/products', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ProductInput>): Promise<{ product: Product }> => {
    const response = await api.put<{ product: Product }>(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
