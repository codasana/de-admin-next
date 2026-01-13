import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { setAuthToken, resetAuthToken, getCookie, setCookie, removeCookie } from '@/lib/auth';

// Cookie name for admin app
const COOKIE_NAME = 'dea-access-token';

interface User {
  id?: number;
  first?: string;
  email: string;
}

interface AuthState {
  isLoading: boolean;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const clearPersistedState = () => {
  localStorage.removeItem('admin-auth-storage');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoading: true,
      user: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await api.post('/api/users/adminlogin', credentials);
          const { token, user } = response.data;
          setAuthToken(token);
          const cookieOptions = {
            expires: 7,
            ...(process.env.NODE_ENV === 'production'
              ? { domain: '.deepenglish.com' }
              : {})
          };
          setCookie(COOKIE_NAME, token, cookieOptions);
          set({ 
            user, 
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        resetAuthToken();
        removeCookie(COOKIE_NAME);
        clearPersistedState();
        set({ 
          user: null, 
          isAuthenticated: false,
        });
      },

      fetchUser: async () => {
        try {
          const token = getCookie(COOKIE_NAME);
          if (token) {
            setAuthToken(token);
            const response = await api.get('/api/users');
            const user = response.data.user;
            set({ 
              user: user, 
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            clearPersistedState();
            set({ 
              user: null, 
              isAuthenticated: false,
              isLoading: false
            });
          }
        } catch (error) {
          console.error('Fetch user failed:', error);
          clearPersistedState();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      onRehydrateStorage: () => {
        return (rehydratedState, error) => {
          if (error) {
            console.log('Error rehydrating state:', error);
          }
        };
      },
    }
  )
);
