import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Customer } from '../types';

interface AuthContextType {
  user: User | null;
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, customer?: Customer | null) => void;
  logout: () => void;
  updateCurrentUser: (user: Partial<User>) => void;
  updateCustomerData: (customer: Partial<Customer>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('billflow_token') || localStorage.getItem('subflow_token');
    const savedUser = localStorage.getItem('billflow_user') || localStorage.getItem('subflow_user');
    const savedCustomer = localStorage.getItem('billflow_customer') || localStorage.getItem('subflow_customer');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedCustomer) {
          setCustomer(JSON.parse(savedCustomer));
        }
      } catch (e) {
        console.error('Failed to parse cached auth state:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newCustomer?: Customer | null) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('billflow_token', newToken);
    localStorage.setItem('billflow_user', JSON.stringify(newUser));

    if (newCustomer) {
      setCustomer(newCustomer);
      localStorage.setItem('billflow_customer', JSON.stringify(newCustomer));
    } else {
      setCustomer(null);
      localStorage.removeItem('billflow_customer');
      localStorage.removeItem('subflow_customer');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCustomer(null);
    localStorage.removeItem('billflow_token');
    localStorage.removeItem('billflow_user');
    localStorage.removeItem('billflow_customer');
    localStorage.removeItem('subflow_token');
    localStorage.removeItem('subflow_user');
    localStorage.removeItem('subflow_customer');
  };

  const updateCurrentUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('billflow_user', JSON.stringify(updated));
  };

  const updateCustomerData = (updatedFields: Partial<Customer>) => {
    if (!customer) return;
    const updated = { ...customer, ...updatedFields } as Customer;
    setCustomer(updated);
    localStorage.setItem('billflow_customer', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateCurrentUser,
        updateCustomerData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
