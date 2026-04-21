import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-10 w-full max-w-md text-center">
        <div className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Auth Error</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Unable to sign you in</h1>
        <p className="text-sm text-slate-500 mb-8">
          {reason ? `Google login returned: ${reason}.` : 'The sign-in flow could not be completed.'}
        </p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-2xl font-bold transition-all"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
