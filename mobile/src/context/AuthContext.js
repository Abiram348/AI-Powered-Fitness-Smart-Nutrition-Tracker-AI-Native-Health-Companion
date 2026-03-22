import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await SecureStore.getItemAsync('user_data');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Failed to load stored auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: authToken, user_id, name } = response.data;
      const userData = { id: user_id, name, email };
      
      await SecureStore.setItemAsync('auth_token', authToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      return userData;
    } catch (error) {
      console.log('Login error:', error?.response?.status, error?.response?.data || error.message);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token: authToken, user_id, name } = response.data;
      const userData = { id: user_id, name, email: data.email };
      
      await SecureStore.setItemAsync('auth_token', authToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      return userData;
    } catch (error) {
      console.log('Register error:', error?.response?.status, error?.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const response = await profileAPI.get();
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
    } catch (e) {
      console.log('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
