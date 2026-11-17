import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard for Tractor Owners (and Platform Admin)
 */
export const OwnerRoute = ({ children }) => {
  const { isAuthenticated, isOwner, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-medium">Verifying Tractor Owner access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/owner/login" state={{ from: location }} replace />;
  }

  if (!isOwner && !isAdmin) {
    // If farmer/customer, redirect to customer dashboard
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
};

export default OwnerRoute;

