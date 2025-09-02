// src/app/scan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { parseHOYNQR, trackQRScan } from '@/lib/qr-utils';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const QRScannerWrapper = dynamic(
  () => import('@/components/qr/QRScannerWrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-64 glass-effect flex items-center justify-center cyber-border">
        <Loading size="lg" text="QR Tarayıcı yükleniyor..." />
      </div>
    )
  }
);

export default function ScanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [scannedData, setScannedData] = useState('');
  const [isHoynQR, setIsHoynQR] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Handle scan results
  const handleScan = (result: string) => {
    if (!result) return;
    
    console.log('QR Scanned:', result);
    setScannedData(result);
    setError('');
    
    // HOYN! QR formatını kontrol et
    const parsedData = parseHOYNQR(result);
    
    if (parsedData) {
      // HOYN! QR bulundu!
      setIsHoynQR(true);
      setQrData(parsedData);
      
      // Analytics tracking
      trackQRScan(parsedData, { scannedBy: user?.uid });
      
      // Otomatik yönlendirme
      checkAndRedirect(parsedData);
    } else {
      // HOYN! QR değil
      setIsHoynQR(false);
      setQrData(null);
      // 3 saniye sonra uyarı göster
      setTimeout(() => {
        if (!isHoynQR) {
          setError('Bu bir HOYN! QR kodu değil. Sadece HOYN! QR kodları desteklenir.');
        }
      }, 1000);
    }
  };

  // Check if HOYN! QR and redirect
  const checkAndRedirect = async (qrData: any) => {
    if (!qrData) return;
    
    setIsRedirecting(true);
    
    // 2 saniye bekle, sonra yönlendir
    setTimeout(() => {
      if (qrData.type === 'profile' && qrData.username) {
        router.push(`/u/${qrData.username}`);
      } else if (qrData.type === 'anonymous' && qrData.username) {
        router.push(`/ask/${qrData.username}`);
      } else if (qrData.type === 'custom' && qrData.url) {
        window.open(qrData.url, '_blank');
        setIsRedirecting(false);
      } else if (qrData.url) {
        window.open(qrData.url, '_blank');
        setIsRedirecting(false);
      }
    }, 2000);
  };

  // Handle errors
  const handleError = (err: any) => {
    console.error('Scan error:', err);
    setError(err?.message || 'QR tarama hatası oluştu.');
  };

  // Reset scanner
  const resetScanner = () => {
    setScannedData('');
    setIsHoynQR(false);
    setQrData(null);
    setError('');
    setIsRedirecting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-2 glow-text">
            📱 HOYN! QR Tarayıcı
          </h1>
          <p className="text-gray-300 mb-1">HOYN! QR kodlarını tarayın</p>
          <p className="text-sm text-purple-300">Sadece HOYN! formatındaki QR'lar desteklenir</p>
        </div>

        {/* Scanner */}
        <AnimatedCard className="mb-6">
          <div className="aspect-square rounded-xl overflow-hidden border-4 border-purple-900 relative">
            <QRScannerWrapper 
              onScan={handleScan} 
              onError={handleError}
            />
          </div>
        </AnimatedCard>

        {/* Results */}
        {error && (
          <AnimatedCard className="mb-4">
            <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <p className="font-bold mb-1">HOYN! QR Değil</p>
              <p className="text-sm">{error}</p>
              <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-600">
                <p className="text-xs text-gray-400 mb-2">Taranan içerik:</p>
                <code className="text-xs text-gray-300 break-all">{scannedData}</code>
              </div>
              <NeonButton 
                onClick={resetScanner} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                🔄 Tekrar Dene
              </NeonButton>
            </div>
          </AnimatedCard>
        )}

        {scannedData && isHoynQR && qrData && (
          <AnimatedCard className="mb-4">
            <div className="glass-effect p-6 rounded-xl cyber-border text-center">
              <div className="text-4xl mb-3">🎆</div>
              <h3 className="text-xl font-bold text-white mb-3">HOYN! QR Bulundu!</h3>
              
              {/* QR Type Info */}
              <div className="bg-purple-900/20 p-4 rounded-lg mb-4 border border-purple-500/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-lg">
                    {qrData.type === 'profile' ? '👤' : 
                     qrData.type === 'anonymous' ? '💬' : '🔗'}
                  </span>
                  <h4 className="font-bold text-purple-300">
                    {qrData.type === 'profile' ? 'Profil QR\'\u0131' : 
                     qrData.type === 'anonymous' ? 'Anonim Mesaj QR\'\u0131' : 'Özel QR'}
                  </h4>
                </div>
                
                {qrData.username && (
                  <p className="text-sm text-white mb-2">
                    Kullanıcı: <span className="font-bold text-purple-300">@{qrData.username}</span>
                  </p>
                )}
                
                <code className="text-xs text-gray-300 break-all bg-gray-900 p-2 rounded block">
                  {qrData.url || scannedData}
                </code>
              </div>
              
              {isRedirecting ? (
                <div className="text-purple-300">
                  <div className="animate-spin inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mb-3"></div>
                  <p className="font-bold">Yönlendiriliyor...</p>
                  <p className="text-sm text-gray-400">
                    {qrData.type === 'profile' ? 'Profile sayfasına yönlendiriliyorsunuz' :
                     qrData.type === 'anonymous' ? 'Anonim mesaj sayfasına yönlendiriliyorsunuz' :
                     'Bağlantı açılıyor'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <NeonButton
                    onClick={() => {
                      if (qrData.type === 'profile') {
                        router.push(`/u/${qrData.username}`);
                      } else if (qrData.type === 'anonymous') {
                        router.push(`/ask/${qrData.username}`);
                      } else if (qrData.url) {
                        window.open(qrData.url, '_blank');
                      }
                    }}
                    variant="primary"
                    size="md"
                    className="w-full"
                    glow
                  >
                    {qrData.type === 'profile' ? '👤 Profile Git' :
                     qrData.type === 'anonymous' ? '💬 Mesaj Gönder' :
                     '🌐 Linki Aç'}
                  </NeonButton>
                  
                  <NeonButton
                    onClick={resetScanner}
                    variant="outline"
                    size="md"
                    className="w-full"
                  >
                    🔄 Yeni QR Tara
                  </NeonButton>
                </div>
              )}
            </div>
          </AnimatedCard>
        )}

        {/* Navigation */}
        <div className="space-y-3">
          <NeonButton
            onClick={() => router.push('/dashboard')}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            ← Dashboard'a Dön
          </NeonButton>
          
          <NeonButton
            onClick={() => router.push('/dashboard/qr-generator')}
            variant="outline"
            size="md"
            className="w-full"
          >
            ✨ QR Oluştur
          </NeonButton>
        </div>

        {/* Tips */}
        <AnimatedCard className="mt-8">
          <div className="text-center p-4">
            <h4 className="text-lg font-bold text-purple-300 mb-3">💡 HOYN! QR Tarayıcı</h4>
            <div className="space-y-3">
              <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
                <p className="text-sm font-bold text-purple-300 mb-1">🎆 HOYN! QR'ları</p>
                <p className="text-xs text-gray-300">Otomatik olarak tanınır ve ilgili sayfaya yönlendirilir</p>
              </div>
              <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                <p className="text-sm font-bold text-red-300 mb-1">⚠️ Diğer QR'lar</p>
                <p className="text-xs text-gray-300">Desteklenmez ve uyarı mesajı gösterilir</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-400">
              <p>📱 QR kodu düz tutun ve odaklanın</p>
              <p>💡 Işık yetersizse flaşı açın</p>
              <p>🎯 QR'ı çerçeve içinde ortalayın</p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}