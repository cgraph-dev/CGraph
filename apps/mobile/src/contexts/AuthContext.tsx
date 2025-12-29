import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cgraph_auth_token';
const REFRESH_TOKEN_KEY = 'cgraph_refresh_token';
const USER_KEY = 'cgraph_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadStoredAuth();
  }, []);
  
  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token is still valid
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch {
          // Token invalid, clear auth
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveAuth = async (authToken: string, refreshToken: string, userData: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, authToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    
    setToken(authToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };
  
  const clearAuth = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };
  
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, tokens } = response.data;
    await saveAuth(tokens.access_token, tokens.refresh_token, userData);
  };
  
  const register = async (email: string, username: string, password: string) => {
    const response = await api.post('/auth/register', { 
      user: { email, username, password }
    });
    const { user: userData, tokens } = response.data;
    await saveAuth(tokens.access_token, tokens.refresh_token, userData);
  };
  
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    await clearAuth();
  };
  
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
