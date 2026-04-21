import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { TOKEN_STORAGE_KEY } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center">
        <div className="text-sm font-semibold text-slate-500">Loading workspace...</div>
      </div>
    );
  }

  if (!auth.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet context={auth} />;
}
