import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TOKEN_STORAGE_KEY } from '../api/client';

export function AuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      navigate('/', { replace: true });
      return;
    }

    navigate('/login', { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center">
      <div className="text-sm font-semibold text-slate-500">Finishing sign-in...</div>
    </div>
  );
}
