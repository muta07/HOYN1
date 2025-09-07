'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import QRScannerWrapper from '@/components/qr/QRScannerWrapper';
import ClientQRGenerator from '@/components/qr/ClientQRGenerator';
import { parseHOYNQR } from '@/lib/qr-utils';
import { getUserUsername, generateHOYNQR } from '@/lib/qr-utils';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function QRTestPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [testMode, setTestMode] = useState<'generate' | 'scan'>('generate');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [parsedQRData, setParsedQRData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [scanning, setScanning] = useState(false);

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
        <Loading size="lg" text="QR Test yükleniyor..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  const username = getUserUsername(user);
  const qrUrl = generateHOYNQR(username);

  const handleScan = (data: string) => {
    setScannedData(data);
    setScanning(false);
    
    // Parse HOYN QR
    const parsed = parseHOYNQR(data);
    if (parsed) {
      setParsedQRData(parsed);
    } else {
      // Non-HOYN QR - show warning
      setShowWarning(true);
    }
  };

  const handleConfirmNonHOYN = () => {
    if (scannedData) {
      try {
        const url = new URL(scannedData);
        window.open(url.href, '_blank');
      } catch {
        setError('Bu QR kod geçerli bir URL içermiyor');
      }
    }
    setShowWarning(false);
    setScannedData(null);
    setParsedQRData(null);
    setError(null);
  };

  const handleCancelNonHOYN = () => {
    setShowWarning(false);
    setScannedData(null);
    setParsedQRData(null);
    setError(null);
  };

  const handleStartScan = () => {
    setScanning(true);
    setScannedData(null);
    setParsedQRData(null);
    setError(null);
    setShowWarning(false);
  };

  if (scanning) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <QRScannerWrapper
          onScan={handleScan}
          onError={(err: any) => {
            console.error('Scanner error:', err);
            setScanning(false);
            setError('QR tarayıcı hatası: ' + err);
          }}
        />
      </div>
    );
  }

  if (showWarning) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <AnimatedCard className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">
            Bu bir HOYN QR kodu değil
          </h1>
          <p className="text-gray-300 mb-6">
            Bu QR kodu HOYN sistemi tarafından oluşturulmamış. Yine de açmak istiyor musunuz?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <NeonButton
              onClick={handleConfirmNonHOYN}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Evet, Aç
            </NeonButton>
            <NeonButton
              onClick={handleCancelNonHOYN}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Hayır, İptal
            </NeonButton>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4">
            HOYN QR Test 🔄
          </h1>
          <p className="text-lg text-gray-300">
            QR oluştur ve test et - HOYN QR sistemi
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4 bg-gray-800 p-4 rounded-xl">
            <NeonButton
              onClick={() => setTestMode('generate')}
              variant={testMode === 'generate' ? 'primary' : 'outline'}
              size="md"
              className="flex-1"
            >
              📱 QR Oluştur
            </NeonButton>
            <NeonButton
              onClick={() => setTestMode('scan')}
              variant={testMode === 'scan' ? 'primary' : 'outline'}
              size="md"
              className="flex-1"
            >
              🔍 QR Tara
            </NeonButton>
          </div>
        </div>

        {/* Generate Mode */}
        {testMode === 'generate' && (
          <div className="space-y-6">
            <AnimatedCard direction="up" className="text-center">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-purple-300 mb-2">QR Kodu Oluştur</h3>
                <p className="text-gray-300">Profilin için HOYN QR kodu</p>
              </div>
              <div className="p-8 bg-white rounded-xl mb-4">
                <ClientQRGenerator 
                  value={qrUrl} 
                  size={256}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  onReady={() => console.log('Test QR hazır')}
                />
              </div>
              <div className="text-sm text-gray-300">
                <p><strong>Durum:</strong> HOYN QR</p>
                <p><strong>İçerik:</strong> {username} profili</p>
                <p><strong>Test:</strong> Bu QR kodu HOYN kullanıcıları tarafından taranabilir</p>
              </div>
            </AnimatedCard>

            <AnimatedCard direction="up" className="p-6">
              <h3 className="text-xl font-bold text-purple-300 mb-3">Test Sonuçları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="text-green-400">
                  <span className="text-2xl">✅</span>
                  <p className="mt-1">QR Oluşturuldu</p>
                  <p>HOYN formatında</p>
                </div>
                <div className="text-green-400">
                  <span className="text-2xl">📱</span>
                  <p className="mt-1">Mobil Uyumlu</p>
                  <p>Telefon kamerası ile test</p>
                </div>
                <div className="text-yellow-400">
                  <span className="text-2xl">⚠️</span>
                  <p className="mt-1">Diğer Tarayıcılar</p>
                  <p>Normal URL olarak açılır</p>
                </div>
                <div className="text-green-400">
                  <span className="text-2xl">🔒</span>
                  <p className="mt-1">HOYN Kullanıcıları</p>
                  <p>Doğrudan profil sayfası</p>
                </div>
              </div>
            </AnimatedCard>
          </div>
        )}

        {/* Scan Mode */}
        {testMode === 'scan' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <NeonButton
                onClick={handleStartScan}
                variant="primary"
                size="lg"
                className="w-full max-w-sm"
              >
                📱 QR Kod Tarat
              </NeonButton>
              <p className="text-sm text-gray-400 mt-2">
                Yukarıdaki QR kodunu tara
              </p>
            </div>

            {scannedData && parsedQRData && (
              <AnimatedCard direction="up" className="p-6">
                <h3 className="text-xl font-bold text-green-400 mb-3">✅ HOYN QR Başarılı!</h3>
                <div className="text-center mb-4">
                  <div className="p-4 bg-white rounded-lg mb-4">
                    <ClientQRGenerator 
                      value={scannedData} 
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  <p><strong>Durum:</strong> HOYN QR</p>
                  <p><strong>Kullanıcı:</strong> {parsedQRData.username}</p>
                  <p><strong>Tip:</strong> {parsedQRData.type}</p>
                </div>
              </AnimatedCard>
            )}

            {scannedData && !parsedQRData && !showWarning && (
              <AnimatedCard direction="up" className="p-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">⚠️ Normal QR Kodu</h3>
                <div className="text-center mb-4">
                  <div className="p-4 bg-white rounded-lg mb-4">
                    <ClientQRGenerator 
                      value={scannedData} 
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  <p><strong>Durum:</strong> Standart QR</p>
                  <p><strong>İçerik:</strong> {scannedData}</p>
                  <p><strong>Test:</strong> HOYN kullanıcıları için özel yönlendirme yok</p>
                </div>
              </AnimatedCard>
            )}

            {error && (
              <AnimatedCard direction="up" className="p-6 text-center">
                <div className="text-2xl mb-3">❌</div>
                <h3 className="text-lg font-bold text-red-400 mb-3">Test Hatası</h3>
                <p className="text-gray-300">{error}</p>
                <NeonButton
                  onClick={handleStartScan}
                  variant="outline"
                  size="md"
                  className="mt-4"
                >
                  Tekrar Dene
                </NeonButton>
              </AnimatedCard>
            )}
          </div>
        )}

        {/* Test Info */}
        <div className="text-center mt-8 p-6 bg-gray-900/50 rounded-xl">
          <h3 className="text-lg font-bold text-purple-300 mb-3">Test Kılavuzu</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>1. <strong>Oluştur:</strong> Yukarıdaki HOYN QR kodunu oluştur</p>
            <p>2. <strong>Tara:</strong> Bu sayfada kamerayı aç ve kodu tara</p>
            <p>3. <strong>Sonuç:</strong> HOYN QR ✅ / Normal QR ⚠️</p>
            <p className="text-xs mt-4 text-purple-400">
              Bu test HOYN QR sisteminin çalışmasını doğrular
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}