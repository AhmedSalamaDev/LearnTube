import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[AuthContext] Checking authentication...');
      const token = localStorage.getItem('auth_token');
      console.log(
        '[AuthContext] Token in localStorage:',
        token ? 'EXISTS' : 'NOT FOUND',
      );

      if (!token) {
        console.log('[AuthContext] No token, skipping API call');
        setUser(null);
        setIsLoading(false);
        return false;
      }

      const response = await api.get('/auth/me');
      console.log('[AuthContext] User authenticated:', response.data.user);
      setUser(response.data.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.log('[AuthContext] User not authenticated:', error);
      setUser(null);
      localStorage.removeItem('auth_token');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[AuthContext] Logout initiated');
    try {
      await api.post('/auth/logout');
      console.log('[AuthContext] Logout API call successful');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      console.log('[AuthContext] User state cleared and token removed');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
