import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

type AllowedRole = 'admin' | 'manufacturer' | 'buyer' | 'general_user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: AllowedRole;
  // Allow multiple roles (e.g., both buyer and general_user can access search)
  allowedRoles?: AllowedRole[];
  // Require manufacturer to be approved
  requireApproval?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
  allowedRoles,
  requireApproval = false
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // 1. Check if logged in
  if (!user) {
    const isAdminRoute = location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? "/admin-login" : "/login"} state={{ from: location }} replace />;
  }

  // 2. Build list of allowed roles
  const rolesAllowed: AllowedRole[] = allowedRoles || (allowedRole ? [allowedRole] : []);
  
  // 3. Check if user's role is allowed (strict check)
  // SECURITY: Explicit role validation - must be a valid role string
  const userRole = user.role;
  const isValidRole = userRole && typeof userRole === 'string' && ['admin', 'manufacturer', 'buyer', 'general_user'].includes(userRole);
  
  if (!isValidRole) {
    console.error(`[SECURITY] Invalid user role detected: "${userRole}" for user ${user.email}`);
    return <Navigate to="/login" replace />;
  }
  
  if (rolesAllowed.length > 0 && !rolesAllowed.includes(userRole as AllowedRole)) {
    // SECURITY: Log unauthorized access attempts
    console.warn(`[SECURITY] Access denied: User "${user.email}" (role: ${userRole}) tried to access ${location.pathname} (allowed: ${rolesAllowed.join(', ')})`);
    
    // Redirect based on user's actual role
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'manufacturer') {
      if (user.approval_status === 'approved') {
        return <Navigate to="/manufacturer-dashboard" replace />;
      } else {
        return <Navigate to="/approval-pending" replace />;
      }
    } else {
      return <Navigate to="/buyer-dashboard" replace />;
    }
  }

  // 4. Special check for manufacturers requiring approval
  if (user.role === 'manufacturer' && requireApproval && user.approval_status !== 'approved') {
    return <Navigate to="/approval-pending" replace />;
  }

  // 5. Also catch pending manufacturers trying to access their dashboard directly
  if (allowedRole === 'manufacturer' && user.role === 'manufacturer' && user.approval_status === 'pending') {
    return <Navigate to="/approval-pending" replace />;
  }

  return <>{children}</>;
};

// Convenience component for routes that allow both buyers and general users
export const BuyerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['buyer', 'general_user']}>
      {children}
    </ProtectedRoute>
  );
};

// Convenience component for manufacturer routes (requires approval)
export const ManufacturerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRole="manufacturer" requireApproval>
      {children}
    </ProtectedRoute>
  );
};

// Convenience component for admin routes
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRole="admin">
      {children}
    </ProtectedRoute>
  );
};
