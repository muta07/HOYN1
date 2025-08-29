// src/app/auth/register/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-6">
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

        <p className="text-sm text-gray-500 mt-8">
          Zaten hesabın var mı?{' '}
          <span
            onClick={() => router.push('/auth/login')}
            className="text-purple-400 hover:underline cursor-pointer"
          >
            Giriş yap
          </span>
        </p>
      </div>
    </div>
  );
}