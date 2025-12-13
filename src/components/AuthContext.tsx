import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  // Admin login (password-based, separate from Supabase)
  loginAdmin: (email: string, password: string) => Promise<User | undefined>;
  // Supabase sign up
  signUp: (email: string, password: string, requestedRole: 'buyer' | 'manufacturer', name: string, companyName?: string) => Promise<void>;
  // Supabase sign in
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  // Fetch user profile from backend using Supabase JWT
  const fetchUserProfile = async (session: Session): Promise<User | null> => {
    try {
      const access_token = session.access_token;
      
      // Use relative path to leverage Vite proxy, or VITE_API_URL if set
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(
        `${apiUrl}/auth/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else {
        const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
        console.error('Failed to fetch user profile:', errorData);
        
        // Show user-friendly error message
        if (response.status === 401) {
          toast.error('Authentication failed. Please try logging in again.');
        } else if (response.status === 404) {
          toast.error('User profile not found. Please contact support.');
        } else {
          toast.error(errorData.msg || 'Failed to load user profile');
        }
        
        return null;
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      
      // More specific error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        toast.error('Cannot connect to backend server. Is it running on port 5000?');
      } else if (error.message?.includes('CORS')) {
        toast.error('CORS error. Check backend CORS configuration.');
      } else {
        toast.error(`Error: ${error.message || 'Network error. Please check your connection and try again.'}`);
      }
      
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSupabaseUser(session.user);
          const userProfile = await fetchUserProfile(session);
          if (userProfile) {
            // SECURITY: Verify email matches between Supabase session and user profile
            const sessionEmail = session.user.email?.toLowerCase();
            const profileEmail = userProfile.email?.toLowerCase();
            
            if (sessionEmail && profileEmail && sessionEmail !== profileEmail) {
              console.error(`[SECURITY] Email mismatch! Session: ${sessionEmail}, Profile: ${profileEmail}. Forcing logout.`);
              await supabase.auth.signOut();
              setSupabaseUser(null);
              setUser(null);
              return;
            }
            
            setUser(userProfile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] State change:', event, session?.user?.email);
      
      if (session) {
        setSupabaseUser(session.user);
        const userProfile = await fetchUserProfile(session);
        if (userProfile) {
          // SECURITY: Verify email matches
          const sessionEmail = session.user.email?.toLowerCase();
          const profileEmail = userProfile.email?.toLowerCase();
          
          if (sessionEmail && profileEmail && sessionEmail !== profileEmail) {
            console.error(`[SECURITY] Email mismatch on auth change! Session: ${sessionEmail}, Profile: ${profileEmail}. Forcing logout.`);
            await supabase.auth.signOut();
            setSupabaseUser(null);
            setUser(null);
            return;
          }
          
          setUser(userProfile);
        }
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Admin login - uses Supabase Auth (same as regular users)
  // Admin must exist in both Supabase Auth AND users table with role='admin'
  const loginAdmin = async (email: string, password: string): Promise<User | undefined> => {
    try {
      // Use Supabase Auth for admin login (same as other users)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Admin login error:', error);
        toast.error(error.message || 'Login failed');
        throw error;
      }

      if (data.session) {
        setSupabaseUser(data.session.user);
        const userProfile = await fetchUserProfile(data.session);
        
        if (userProfile) {
          // Verify this is actually an admin
          if (userProfile.role !== 'admin') {
            await supabase.auth.signOut();
            toast.error('Access denied. Admin credentials required.');
            throw new Error('Not an admin account');
          }
          
          setUser(userProfile);
          toast.success(`Welcome back, ${userProfile.name || 'Admin'}!`);
          return userProfile;
        } else {
          // User authenticated but no profile in users table
          await supabase.auth.signOut();
          toast.error('Admin profile not found in database.');
          throw new Error('Admin profile not found');
        }
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      throw error;
    }
  };

  // Supabase sign up
  const signUp = async (
    email: string,
    password: string,
    requestedRole: 'buyer' | 'manufacturer',
    name: string,
    companyName?: string
  ): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            requested_role: requestedRole,
            name: name,  // User's display name/username
            company_name: companyName || ''
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        // Provide more specific error messages
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else if (error.message.includes('password')) {
          toast.error('Password must be at least 6 characters long.');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        throw error;
      }

      if (data.user) {
        // Check if user is already confirmed (auto-confirmed or already verified)
        if (data.user.email_confirmed_at || data.session) {
          toast.success('Account created successfully! You can now sign in.');
          // If we have a session, fetch user profile immediately
          if (data.session) {
            const userProfile = await fetchUserProfile(data.session);
            if (userProfile) {
              setUser(userProfile);
            }
          }
        } else {
          toast.success('Account created! Please check your email to verify your account.');
        }
      } else {
        toast.error('Account creation failed. Please try again.');
        throw new Error('No user data returned from signup');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Don't show duplicate error toast if we already showed one above
      if (!error.message?.includes('already registered') && !error.message?.includes('password')) {
        toast.error(error.message || 'Failed to create account');
      }
      throw error;
    }
  };

  // Supabase sign in
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        setSupabaseUser(data.session.user);
        const userProfile = await fetchUserProfile(data.session);
        if (userProfile) {
          setUser(userProfile);
          
          // Show appropriate toast based on user state
          if (userProfile.role === 'manufacturer' && userProfile.approval_status === 'pending') {
            toast.info('Your manufacturer account is pending approval');
          } else {
            toast.success(`Welcome, ${userProfile.name || userProfile.email}!`);
          }
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      navigate('/');
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if Supabase signout fails
      setUser(null);
      setSupabaseUser(null);
    }
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
      signUp,
      signIn,
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
