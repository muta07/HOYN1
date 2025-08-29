// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  if (loading) return <div className="text-white">Yükleniyor...</div>;

  return (
  
<div className="py-24 px-6 text-center">
      <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron">
        HOYN!
      </h1>
      <p className="text-xl text-gray-300 mt-6 max-w-2xl mx-auto">
        QR kodunla tanış, tişörtüne bas, dünyaya göster.
      </p>

      <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-gray-900 p-6 rounded-xl">
          <h3 className="text-2xl font-bold text-purple-400 mb-4">🚗 Araban mı Var?</h3>
          <p>QR’ını camına yapıştır. Sigorta, muayene, satılık ilanı — her şey tek tıkta.</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl">
          <h3 className="text-2xl font-bold text-purple-400 mb-4">🐱 Evcil Hayvanın mı Var?</h3>
          <p>Kolyesine QR koy. Kaybolursa, sahibine ulaşmak kolay.</p>
        </div>
      </div>

      <div className="mt-10 space-x-4">
        <button
          onClick={() => router.push('/auth/register')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-bold hover:shadow-lg transition"
        >
          Başla Şimdi
        </button>
        <button
          onClick={() => router.push('/auth/login')}
          className="border border-purple-500 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-900 transition"
        >
          Giriş Yap
        </button>
      </div>
    </div>
  );
}