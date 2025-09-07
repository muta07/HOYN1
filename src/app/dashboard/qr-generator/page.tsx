'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName, getUserUsername, generateHOYNQR } from '@/lib/qr-utils';
import ClientQRGenerator from '@/components/qr/ClientQRGenerator';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';

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
  const username = getUserUsername(user);
  
  // Generate HOYN QR URL
  const qrUrl = generateHOYNQR(username);

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
          HOYN QR Kodu Oluştur 🔐
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          HOYN QR sistemi ile profilinizi paylaşın!
        </p>
        <p className="text-purple-300">
          Kullanıcı: <span className="font-bold text-white">{displayName}</span>
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Bu QR kod HOYN kullanıcıları tarafından taranabilir
        </p>
      </div>

      {/* QR Generator Component */}
      <div className="flex justify-center mb-8">
        <div className="p-8 bg-white rounded-xl">
          <ClientQRGenerator 
            value={qrUrl} 
            size={256}
            bgColor="#ffffff"
            fgColor="#000000"
            onReady={() => console.log('HOYN QR kod hazır')}
          />
        </div>
      </div>
      
      {/* Info Section */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <div className="glass-effect p-6 rounded-xl cyber-border">
          <h3 className="text-xl font-bold text-purple-300 mb-3">QR Kodunuz Hazır! 🔒</h3>
          <p className="text-gray-300 mb-4">
            Bu QR kod HOYN kullanıcıları tarafından taranabilir ve doğrudan profil sayfanıza yönlendirir.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">👤 Profil</span>
            <span className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">📱 Mobil Uyumlu</span>
            <span className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">🛡️ HOYN Koruma</span>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Diğer QR tarayıcılar bu kodu okuyabilir ama HOYN kullanıcıları için en iyi deneyim.
          </p>
        </div>
      </div>

      {/* Test Link */}
      <div className="text-center">
        <NeonButton
          onClick={() => router.push('/dashboard/qr-test')}
          variant="outline"
          size="md"
        >
          ✅ QR Test Sayfası
        </NeonButton>
        <p className="text-gray-400 text-sm mt-2">
          QR kodun düzgün çalıştığını test edin
        </p>
      </div>
    </div>
  );
}