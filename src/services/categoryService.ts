import api from '@/lib/api';
import { Category } from '@/types';
import { CategoryInput } from '@/lib/utils/validation';

export const categoryService = {
  getAll: async (): Promise<{ categories: Category[] }> => {
    const response = await api.get<{ categories: Category[] }>('/categories');
    return response.data;
  },

  getById: async (id: number): Promise<{ category: Category }> => {
    const response = await api.get<{ category: Category }>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CategoryInput): Promise<{ category: Category }> => {
    const response = await api.post<{ category: Category }>('/categories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CategoryInput>): Promise<{ category: Category }> => {
    const response = await api.put<{ category: Category }>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
