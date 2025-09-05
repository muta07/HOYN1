// src/app/dashboard/qr-test/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserUsername } from '@/lib/qr-utils';
import ClientQRGenerator from '@/components/qr/ClientQRGenerator';
import Loading from '@/components/ui/Loading';

export default function QRTestPage() {
  const { user, loading: authLoading } = useAuth();
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
        <Loading size="lg" text="Sayfa yükleniyor..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  const username = getUserUsername(user);
  
  // Create the profile URL for the QR code
  const profileUrl = `${window.location.origin}/u/${username}`;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
          QR Test Sayfası ✅
        </h1>
        <p className="text-gray-300">
          QR kodun doğru oluşturulduğunu ve indirilebildiğini test edin
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="glass-effect p-8 rounded-xl cyber-border">
          <h2 className="text-2xl font-bold text-white mb-6">Profil QR Kodunuz</h2>
          
          <div className="flex flex-col items-center">
            <ClientQRGenerator 
              value={profileUrl} 
              size={256}
              bgColor="#ffffff"
              fgColor="#9b5de5"
              onReady={() => console.log('QR kod hazır')}
            />
            
            <div className="mt-8 text-center">
              <h3 className="text-xl font-bold text-purple-300 mb-3">Test Talimatları</h3>
              <div className="bg-gray-900/50 p-4 rounded-lg text-left">
                <ol className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-purple-400 font-bold mr-2">1.</span>
                    <span>Yukarıdaki QR kodun doğru göründüğünü kontrol edin</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 font-bold mr-2">2.</span>
                    <span>"QR Kodu İndir" butonuna tıklayın</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 font-bold mr-2">3.</span>
                    <span>İndirilen dosyayı açın ve QR kodun düzgün göründüğünü doğrulayın</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 font-bold mr-2">4.</span>
                    <span>Telefonunuzla QR kodu tarayın ve doğru profile yönlendirildiğini kontrol edin</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard/qr-generator')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ← QR Oluşturucuya Dön
          </button>
        </div>
      </div>
    </div>
  );
}