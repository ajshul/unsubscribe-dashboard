import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, User } from '@/utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (code: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log('AuthContext: Initializing auth...');
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      console.log('AuthContext: Token exists:', !!token);
      console.log('AuthContext: Saved user exists:', !!savedUser);

      if (token && savedUser) {
        try {
          console.log('AuthContext: Parsing saved user...');
          // Try to parse saved user first
          const parsedUser = JSON.parse(savedUser);
          console.log('AuthContext: Parsed user:', parsedUser);
          setUser(parsedUser);

          // Validate token with server
          console.log('AuthContext: Validating token with server...');
          const response = await authAPI.getCurrentUser();
          const serverUser = response.data.user;
          console.log('AuthContext: Server user:', serverUser);

          // Update with fresh data from server
          setUser(serverUser);
          localStorage.setItem('user', JSON.stringify(serverUser));
          console.log('AuthContext: User validation successful');
        } catch (error) {
          console.error('AuthContext: Failed to validate current user:', error);
          // Clear invalid auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('AuthContext: No existing auth data, setting clean state');
        // No token or user data, ensure clean state
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
      }
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (code: string): Promise<User> => {
    setLoading(true);
    try {
      console.log('AuthContext: Starting login with code:', code.substring(0, 20) + '...');
      const response = await authAPI.googleCallback(code);
      const { token, user: userData } = response.data;

      if (!token || !userData) {
        throw new Error('Invalid response from server: missing token or user data');
      }

      console.log('AuthContext: Login successful, storing auth data:', userData);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('AuthContext: Setting user state:', userData);
      setUser(userData);

      console.log('AuthContext: Login complete, user set');
      return userData;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      // Clear any partial auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clean up local state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !loading
  };

  console.log('AuthContext: Current state:', {
    user: user ? { id: user.id, email: user.email } : null,
    loading,
    isAuthenticated: value.isAuthenticated,
    hasToken: !!localStorage.getItem('authToken')
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
