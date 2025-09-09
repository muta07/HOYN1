// src/components/Navbar.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName } from '@/lib/qr-utils';
import { ROUTES } from '@/lib/constants';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import MessagesButton from '@/components/ui/MessagesButton';

export default function Navbar() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogoClick = () => {
    if (user) router.push('/dashboard');
    else router.push('/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b border-purple-900/30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div
          onClick={handleLogoClick}
          className="text-2xl font-black glow-text cursor-pointer font-orbitron float
                     bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent"
        >
          HOYN!
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <Loading size="sm" />
          ) : user ? (
            <>
              <span className="text-purple-300 text-sm font-orbitron">
                Merhaba, {getUserDisplayName(user, profile)}
              </span>
              <MessagesButton />
              <NeonButton
                onClick={() => router.push('/dashboard')}
                variant="secondary"
                size="sm"
              >
                Profil
              </NeonButton>
              <NeonButton
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                Çıkış
              </NeonButton>
            </>
          ) : (
            <>
              <NeonButton
                onClick={() => router.push('/auth/login')}
                variant="outline"
                size="sm"
              >
                Giriş Yap
              </NeonButton>
              <NeonButton
                onClick={() => router.push('/auth/register')}
                variant="primary"
                size="sm"
                glow
              >
                Başla Şimdi
              </NeonButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}