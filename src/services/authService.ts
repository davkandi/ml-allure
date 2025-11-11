import api from '@/lib/api';
import { AuthResponse, User } from '@/types';
import { LoginInput, RegisterInput } from '@/lib/utils/validation';

export const authService = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  refreshToken: async (token: string): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('/auth/refresh', { token });
    return response.data;
  },
};
