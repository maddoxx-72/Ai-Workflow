import { useEffect, useState } from 'react';
import authApi from '../api/auth';
import { TOKEN_STORAGE_KEY } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    async function loadUser() {
      try {
        const response = await authApi.getCurrentUser();

        if (isMounted) {
          setUser(response.user ?? null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!token) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout transport failures and clear local auth state regardless.
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.location.replace('/login');
    }
  }

  return { user, loading, logout };
}
