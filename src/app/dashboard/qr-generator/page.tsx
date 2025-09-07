'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName, getUserUsername } from '@/lib/qr-utils';
import { generateQRPayload } from '@/lib/firebase';
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
  
  // Generate encrypted QR payload
  const profileId = user.uid;
  const encryptedPayload = generateQRPayload(profileId, username);

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
          Şifreli QR Kodu Oluştur 🔐
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          HOYN şifreli QR sistemi ile profilinizi koruyun!
        </p>
        <p className="text-purple-300">
          Kullanıcı: <span className="font-bold text-white">{displayName}</span>
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Bu QR kod sadece HOYN tarayıcı ile okunabilir
        </p>
      </div>

      {/* QR Generator Component */}
      <div className="flex justify-center mb-8">
        <div className="p-8 bg-white rounded-xl">
          <ClientQRGenerator 
            value={encryptedPayload} 
            size={256}
            bgColor="#ffffff"
            fgColor="#000000"
            onReady={() => console.log('Şifreli QR kod hazır')}
          />
        </div>
      </div>
      
      {/* Info Section */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <div className="glass-effect p-6 rounded-xl cyber-border">
          <h3 className="text-xl font-bold text-purple-300 mb-3">Güvenli QR Kodunuz Hazır! 🔒</h3>
          <p className="text-gray-300 mb-4">
            Bu QR kod HOYN şifreleme sistemi ile korunuyor. Sadece HOYN QR tarayıcı 
            ile okunabilir ve doğrudan profil sayfanıza yönlendirir.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">🔐 Şifreli</span>
            <span className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">👤 Profil</span>
            <span className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">📱 Mobil Uyumlu</span>
            <span className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">🛡️ HOYN Koruma</span>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Diğer QR tarayıcılar bu kodu okuyamaz ve uyarı gösterir.
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
