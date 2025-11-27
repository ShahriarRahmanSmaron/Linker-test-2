import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'buyer' | 'manufacturer' | 'admin' | null;

interface User {
  role: UserRole;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const login = (role: UserRole, email: string) => {
    // Simulate user data based on role
    let name = '';
    if (role === 'buyer') name = 'Emma Lewis';
    else if (role === 'manufacturer') name = 'Masco Knits Ltd.';
    else if (role === 'admin') name = 'System Admin';

    const userData: User = {
      role,
      email,
      name
    };
    setUser(userData);

    // Persist to local storage (optional for demo)
    localStorage.setItem('linker_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('linker_user');
    navigate('/');
  };

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('linker_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};