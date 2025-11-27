
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // If user is logged in but wrong role, redirect to their appropriate dashboard or home
    if (user?.role === 'buyer') return <Navigate to="/search" replace />;
    if (user?.role === 'manufacturer') return <Navigate to="/manufacturer-dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
