
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import QRScanner from '@/components/qr/QRScanner';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';

export default function QRScannerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?returnUrl=/dashboard/qr-scanner');
    }
  }, [user, authLoading, router]);

  const handleScanSuccess = async (scannedToken: string) => {
    if (!user) {
      setApiError('Doğrulama yapmak için giriş yapmalısınız.');
      return;
    }
    
    // Aynı QR kodun tekrar tekrar taranmasını önle
    if (apiLoading) return;

    setApiLoading(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token: scannedToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'QR Kod doğrulanamadı.');
      }

      setApiSuccess(`Doğrulama başarılı! ${result.generatorUsername} profiline yönlendiriliyorsunuz...`);

      // Yönlendirme için kısa bir gecikme
      setTimeout(() => {
        router.push(`/u/${result.generatorUsername}`);
      }, 2000);

    } catch (err: any) {
      setApiError(err.message);
      console.error('QR verification error:', err);
    } finally {
      // Hata durumunda yüklenme durumunu hemen kaldır, başarı durumunda yönlendirme olacağı için gerek yok
      if (apiError) {
        setApiLoading(false);
      }
    }
  };

  const handleScanError = (error: Error) => {
    setApiError(`Tarama Hatası: ${error.message}. Lütfen kamera iznini kontrol edin.`);
    console.error('QR Scan error in page:', error);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loading size="lg" text="Tarayıcı hazırlanıyor..." /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 glow-text">
            📱 QR <span className="text-purple-400">Doğrulama</span>
          </h1>
          <p className="text-xl text-gray-300">
            Bir HOYN tek kullanımlık QR kodunu tarayın.
          </p>
        </div>

        <div className="glass-effect p-4 sm:p-6 rounded-2xl cyber-border">
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              paused={apiLoading || !!apiSuccess} // API işlemi sırasında veya başarı sonrası tarayıcıyı duraklat
            />
        </div>

        {/* API Durum Bildirimleri */}
        <div className="mt-6 text-center h-24 flex items-center justify-center">
          {apiLoading && <Loading text="QR Kod doğrulanıyor..." />}
          
          {apiError && (
            <div className="w-full bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg">
              <p className="font-bold mb-1">Doğrulama Başarısız</p>
              <p className="text-sm">{apiError}</p>
            </div>
          )}

          {apiSuccess && (
            <div className="w-full bg-green-900/30 border border-green-500 text-green-300 p-4 rounded-lg">
              <p className="font-bold mb-1">Başarılı!</p>
              <p className="text-sm">{apiSuccess}</p>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
            <NeonButton onClick={() => router.push('/dashboard')} variant='outline'>
                Panele Dön
            </NeonButton>
        </div>

      </div>
    </div>
  );
}
