import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthErrorPage } from './pages/AuthErrorPage';
import { AuthSuccessPage } from './pages/AuthSuccessPage';
import { LoginPage } from './pages/LoginPage';
import { WorkspacePage } from './pages/WorkspacePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/success" element={<AuthSuccessPage />} />
      <Route path="/auth/error" element={<AuthErrorPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<WorkspacePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
