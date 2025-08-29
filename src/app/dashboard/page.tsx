// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  if (!user) return null;

  // ✅ user.email null olabilir, onu kontrol et
  const username = user.email
    ? user.email.split('@')[0]
    : user.uid.substring(0, 10); // fallback: uid'in başı

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 text-center">
          HOYN! Panel
        </h1>
        <p className="text-gray-300 text-center mb-12">
          Hoş geldin, <span className="font-bold">{username}</span>! Kimliğini paylaşmaya hazır mısın?
        </p>

        {/* Ana Eylem Butonları */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div
            onClick={() => router.push('/dashboard/qr-generator')}
            className="p-8 bg-gray-900 rounded-xl border border-purple-900 hover:border-purple-500 cursor-pointer transition-all transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold text-white mb-3">✨ QR Kod Oluştur</h2>
            <p className="text-gray-300">
              Kim olduğunu bir QR ile anlat. Tişörtüne bas, telefonuna yapıştır, dünyaya göster.
            </p>
          </div>

          <div
            onClick={() => router.push('/dashboard/profile')}
            className="p-8 bg-gray-900 rounded-xl border border-purple-900 hover:border-purple-500 cursor-pointer transition-all transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold text-white mb-3">👤 Profilini Yönet</h2>
            <p className="text-gray-300">
              Bio, sosyal medya, anonim soru ayarları – kim olduğunu özelleştir.
            </p>
          </div>
        </div>

        {/* Diğer İşlevler */}
        <div className="grid md:grid-cols-3 gap-6">
          <div
            onClick={() => router.push('/dashboard/settings')}
            className="p-6 bg-gray-900 rounded-lg border border-gray-700 hover:border-purple-600 text-center cursor-pointer transition"
          >
            <h3 className="font-bold text-white">⚙️ Ayarlar</h3>
          </div>
          <div
            onClick={() => router.push('/scan')}
            className="p-6 bg-gray-900 rounded-lg border border-gray-700 hover:border-purple-600 text-center cursor-pointer transition"
          >
            <h3 className="font-bold text-white">🔍 QR Tara</h3>
          </div>
          <div
            onClick={() => {
              if (confirm('Çıkış yapmak istediğine emin misin?')) {
                router.push('/');
              }
            }}
            className="p-6 bg-gray-900 rounded-lg border border-gray-700 hover:border-purple-600 text-center cursor-pointer transition"
          >
            <h3 className="font-bold text-white">🚪 Çıkış Yap</h3>
          </div>
        </div>
      </div>
    </div>
  );
}