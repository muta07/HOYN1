// src/app/dashboard/qr-generator/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName } from '@/lib/qr-utils';
import QRGenerator from '@/components/qr/QRGenerator';
import Loading from '@/components/ui/Loading';

export default function QRGeneratorPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="QR Generator yükleniyor..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  const displayName = getUserDisplayName(user, profile);

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
          QR Kodu Oluştur ✨
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Kimliğini QR'a dönüştür, her yere yapıştır!
        </p>
        <p className="text-purple-300">
          Kullanıcı: <span className="font-bold text-white">{displayName}</span>
        </p>
      </div>

      {/* QR Generator Component */}
      <QRGenerator />
    </div>
  );
}