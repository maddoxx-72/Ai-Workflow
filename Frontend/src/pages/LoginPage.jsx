import React from 'react';
import { Navigate } from 'react-router-dom';
import { API_URL, TOKEN_STORAGE_KEY } from '../api/client';

export function LoginPage() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-10 w-full max-w-md text-center">
        <div className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Synapse OS</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Sign in to your workspace</h1>
        <p className="text-sm text-slate-500 mb-8">Authenticate with Google to access your AI workspace and connected tools.</p>
        <button
          onClick={() => window.location.assign(`${API_URL}/api/auth/google`)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl font-bold transition-all"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
