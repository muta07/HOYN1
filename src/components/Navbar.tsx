// src/components/Navbar.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogoClick = () => {
    if (user) router.push('/dashboard');
    else router.push('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-purple-900">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div
          onClick={handleLogoClick}
          className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer font-orbitron"
        >
          HOYN!
        </div>

        <div className="flex items-center gap-6">
          {loading ? null : user ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg font-bold"
            >
              Panel
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-purple-300 hover:text-purple-100 transition"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg font-bold hover:shadow-lg transition"
              >
                Başla Şimdi
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}