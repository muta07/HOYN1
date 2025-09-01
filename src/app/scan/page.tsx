// src/app/scan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
    
    // Check if it's a HOYN! QR and auto-redirect
    checkAndRedirect(result);
  };

  // Check if HOYN! QR and redirect
  const checkAndRedirect = async (qrValue: string) => {
    const hoynProfileMatch = qrValue.match(/(?:https?:\/\/)?(?:hoyn\.app|localhost:\d+)\/u\/([\w-]+)/);
    const hoynAskMatch = qrValue.match(/(?:https?:\/\/)?(?:hoyn\.app|localhost:\d+)\/ask\/([\w-]+)/);
    
    if (hoynProfileMatch) {
      const username = hoynProfileMatch[1];
      setIsRedirecting(true);
      setTimeout(() => router.push(`/u/${username}`), 1000);
    } else if (hoynAskMatch) {
      const username = hoynAskMatch[1];
      setIsRedirecting(true);
      setTimeout(() => router.push(`/ask/${username}`), 1000);
    }
  };

  // Handle errors
  const handleError = (err: any) => {
    console.error('Scan error:', err);
    setError(err?.message || 'QR tarama hatası oluştu.');
  };

  // Reset scanner
  const resetScanner = () => {
    setScannedData('');
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
            📱 QR Tarayıcı
          </h1>
          <p className="text-gray-300">QR kodunu kameraya tutun</p>
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
              <p className="font-bold mb-1">Hata</p>
              <p className="text-sm">{error}</p>
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

        {scannedData && (
          <AnimatedCard className="mb-4">
            <div className="glass-effect p-6 rounded-xl cyber-border text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-bold text-white mb-3">QR Kodu Bulundu!</h3>
              
              <div className="bg-gray-900 p-3 rounded-lg mb-4">
                <code className="text-xs text-white break-all">{scannedData}</code>
              </div>
              
              {isRedirecting ? (
                <div className="text-purple-300">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></div>
                  <p>Yönlendiriliyor...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <NeonButton
                    onClick={() => window.open(scannedData, '_blank')}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    🌐 Linki Aç
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
            <h4 className="text-lg font-bold text-purple-300 mb-3">💡 İpuçları</h4>
            <div className="space-y-2 text-sm text-gray-400">
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