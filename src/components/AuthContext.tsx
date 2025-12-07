import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export type UserRole = 'buyer' | 'manufacturer' | 'admin' | 'general_user' | null;
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'none';

interface User {
  id: number;
  role: UserRole;
  name: string;
  email: string;
  approval_status: ApprovalStatus;
  is_verified_buyer: boolean;
}

interface AuthContextType {
  user: User | null;
  // Legacy login for admin only
  loginAdmin: (email: string, password: string) => Promise<User | undefined>;
  // Clerk-based sync for buyers/manufacturers
  syncClerkUser: (requestedRole?: 'buyer' | 'manufacturer', companyName?: string) => Promise<User | undefined>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Helper to check if user can access certain features
  canRequestSamples: boolean;
  isApprovedManufacturer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Clerk hooks
  const { isSignedIn, isLoaded: clerkLoaded, signOut: clerkSignOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  // Sync Clerk user with backend and get Flask JWT
  const syncClerkUser = useCallback(async (
    requestedRole: 'buyer' | 'manufacturer' = 'buyer',
    companyName?: string
  ): Promise<User | undefined> => {
    if (!isSignedIn || !clerkUser) {
      console.warn("syncClerkUser called but user not signed in to Clerk");
      return undefined;
    }

    try {
      // Get Clerk session token
      const clerkToken = await getToken();
      
      if (!clerkToken) {
        throw new Error("Failed to get Clerk session token");
      }

      // Call backend sync endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')}/auth/clerk-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clerkToken}`
          },
          body: JSON.stringify({
            requested_role: requestedRole,
            company_name: companyName || ''
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Store Flask JWT for API calls
        localStorage.setItem('token', data.token);
        setUser(data.user);
        
        // Show appropriate toast based on user state
        if (data.user.role === 'manufacturer' && data.user.approval_status === 'pending') {
          toast.info('Your manufacturer account is pending approval');
        } else {
          toast.success(`Welcome, ${data.user.name || data.user.email}!`);
        }
        
        return data.user;
      } else {
        const error = await response.json();
        // Log full error details for debugging
        console.error('Clerk sync API error:', error);
        const errorMessage = error.msg || error.error || 'Authentication sync failed';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Clerk sync error:", error);
      throw error;
    }
  }, [isSignedIn, clerkUser, getToken]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      // Wait for Clerk to load
      if (!clerkLoaded) return;
      
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token invalid
            localStorage.removeItem('token');
            
            // If signed into Clerk, try to sync
            if (isSignedIn) {
              await syncClerkUser();
            }
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
          localStorage.removeItem('token');
        }
      } else if (isSignedIn) {
        // Signed into Clerk but no local token - sync
        try {
          await syncClerkUser();
        } catch (error) {
          console.error("Auto-sync failed:", error);
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, [clerkLoaded, isSignedIn, syncClerkUser]);

  // Legacy login for admin users only
  const loginAdmin = async (email: string, password: string): Promise<User | undefined> => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        // Enhance user profile with new fields
        const userProfile: User = {
          ...data.user_profile,
          approval_status: data.user_profile.approval_status || 'none',
          is_verified_buyer: data.user_profile.is_verified_buyer || false
        };
        
        setUser(userProfile);
        toast.success(`Welcome back, ${userProfile.name || 'Admin'}!`);
        return userProfile;
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Login failed');
        throw new Error(error.msg);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('token');
    
    // Sign out from Clerk if signed in
    if (isSignedIn) {
      try {
        await clerkSignOut();
      } catch (error) {
        console.error("Clerk sign out error:", error);
      }
    }
    
    navigate('/');
    toast.info('Logged out successfully');
  };

  const isAuthenticated = !!user;
  
  // Helper: can user request samples? (verified buyers only)
  const canRequestSamples = user?.role === 'buyer' && user?.is_verified_buyer === true;
  
  // Helper: is user an approved manufacturer?
  const isApprovedManufacturer = user?.role === 'manufacturer' && user?.approval_status === 'approved';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loginAdmin, 
      syncClerkUser,
      logout, 
      isAuthenticated, 
      isLoading,
      canRequestSamples,
      isApprovedManufacturer
    }}>
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
