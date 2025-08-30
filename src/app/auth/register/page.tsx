// src/app/auth/register/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Eğer zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-black glow-text font-orbitron mb-6 float
                       bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          HOYN!
        </h1>
        <p className="text-gray-300 mb-8">Hangi tür hesap oluşturmak istiyorsun?</p>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/auth/register/personal')}
            className="w-full p-6 bg-gray-900 rounded-xl border border-gray-700 hover:border-purple-500 transition text-left"
          >
            <h3 className="text-xl font-bold text-white">👤 Bireysel Hesap</h3>
            <p className="text-gray-400 mt-2">Profil, sosyal medya, anonim soru al</p>
          </button>

          <button
            onClick={() => router.push('/auth/register/business')}
            className="w-full p-6 bg-gray-900 rounded-xl border border-gray-700 hover:border-purple-500 transition text-left"
          >
            <h3 className="text-xl font-bold text-white">🏢 İşletme Hesabı</h3>
            <p className="text-gray-400 mt-2">Menü, çalışan QR’ları, müşteri etkileşimi</p>
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          Zaten hesabın var mı?{' '}
          <span
            onClick={() => router.push('/auth/login')}
            className="text-purple-400 hover:text-purple-300 cursor-pointer font-bold transition-colors"
          >
            Giriş yap
          </span>
        </p>
      </div>
    </div>
  );
}