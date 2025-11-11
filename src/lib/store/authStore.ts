import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

let refreshTokenTimer: NodeJS.Timeout | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
        
        // Start auto-refresh timer (refresh 5 minutes before expiration)
        if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
        const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
        const refreshTime = expiresIn - (5 * 60 * 1000); // 5 minutes before
        refreshTokenTimer = setTimeout(() => {
          get().refreshToken();
        }, refreshTime);
      },
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            set({ isLoading: false });
            return { success: false, error: data.message || 'Échec de la connexion' };
          }
          
          get().setAuth(data.user, data.token);
          set({ isLoading: false });
          
          // Determine redirect based on role
          const redirectTo = data.user.role === 'ADMIN' ? '/admin' : '/compte';
          return { success: true, redirectTo };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },
      
      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            set({ isLoading: false });
            return { success: false, error: result.message || "Échec de l'inscription" };
          }
          
          // Auto-login after successful registration
          get().setAuth(result.user, result.token);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        if (refreshTokenTimer) {
          clearTimeout(refreshTokenTimer);
          refreshTokenTimer = null;
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      refreshToken: async () => {
        const currentToken = get().token;
        if (!currentToken) return;
        
        try {
          const response = await fetch('http://localhost:5000/api/auth/refresh', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            set({ token: data.token });
            
            // Restart refresh timer
            if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
            const expiresIn = 7 * 24 * 60 * 60 * 1000;
            const refreshTime = expiresIn - (5 * 60 * 1000);
            refreshTokenTimer = setTimeout(() => {
              get().refreshToken();
            }, refreshTime);
          } else {
            // Token refresh failed, logout
            get().logout();
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },
      
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);