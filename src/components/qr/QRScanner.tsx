'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { incrementQRScans } from '@/lib/stats';
import { parseHOYNQR, QRData } from '@/lib/qr-utils';

interface QRScannerProps {
  className?: string;
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: Error) => void;
}

interface ScanResult {
  data: string;
  timestamp: number;
  isHoynQR: boolean;
  hoynData?: QRData | null;
}

export default function QRScanner({ className = '', onScanSuccess, onScanError }: QRScannerProps) {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setError('Kamera erişimi gerekli. Lütfen tarayıcı ayarlarınızdan kamera iznini verin.');
    }
  };

  const handleScanSuccess = useCallback((detectedCodes: any[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const result = detectedCodes[0]?.rawValue || detectedCodes[0]?.data;
    if (!result || result.trim() === '') return;

    const parsedResult = parseHOYNQR(result);
    const scanData: ScanResult = {
      data: result,
      timestamp: Date.now(),
      isHoynQR: !!parsedResult,
      hoynData: parsedResult,
    };

    setScanResult(scanData);
    setScanHistory(prev => [scanData, ...prev.slice(0, 9)]);

    if (scanData.isHoynQR && scanData.hoynData?.username) {
      incrementQRScans(scanData.hoynData.username).catch(err => console.error('Failed to track QR scan stats:', err));
    }

    onScanSuccess?.(result);
    setIsScanning(false);
    if ('vibrate' in navigator) navigator.vibrate(100);
  }, [onScanSuccess]);

  const handleScanError = useCallback((error: unknown) => {
    const errorMsg = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Scan error:', errorMsg);
    if (errorMsg.message.includes('Permission') || errorMsg.message.includes('NotAllowed')) {
      setError(`Kamera hatası: ${errorMsg.message}`);
    }
    onScanError?.(errorMsg);
  }, [onScanError]);

  const handleQRRedirect = useCallback((scanData: ScanResult) => {
    try {
      if (scanData.isHoynQR && scanData.hoynData) {
        const { type, username } = scanData.hoynData;
        if (type === 'anonymous' && username) {
          router.push(`/ask/${encodeURIComponent(username)}`);
        } else if (type === 'profile' && username) {
          router.push(`/u/${encodeURIComponent(username)}`);
        } else {
          setError('Tanınmayan HOYN QR tipi.');
        }
      } else {
        try {
          const url = new URL(scanData.data);
          if (['http:', 'https:'].includes(url.protocol)) {
            if (confirm(`Bu bir Hoyn QR değil. Dış bağlantı açılacak:\n${scanData.data}\n\nDevam edilsin mi?`)) {
              window.open(scanData.data, '_blank', 'noopener,noreferrer');
            }
          } else {
            setError(`Güvenli olmayan protokol: ${url.protocol}`);
          }
        } catch {
          navigator.clipboard.writeText(scanData.data);
          setError('URL olmayan QR içerik panoya kopyalandı.');
        }
      }
    } catch (error) {
      console.error('❌ Redirect error:', error);
      setError('Bağlantı açılırken bir hata oluştu.');
    }
  }, [router]);

  useEffect(() => {
    if (scanResult) {
      const isRecentScan = (Date.now() - scanResult.timestamp) < 1500;
      if (isRecentScan) {
        handleQRRedirect(scanResult);
      }
    }
  }, [scanResult, handleQRRedirect]);

  const startScanning = () => {
    if (hasPermission === false) {
      checkCameraPermission();
      return;
    }
    setIsScanning(true);
    setError(null);
    setScanResult(null);
  };

  const renderScanResult = (result: ScanResult) => {
    if (result.isHoynQR && result.hoynData) {
      const { username, type, data } = result.hoynData;
      const mode = data?.m || 'profile';
      const modeEmoji = mode === 'note' ? '📝' : mode === 'song' ? '🎵' : '👤';
      const typeText = type === 'anonymous' ? 'Anonim Mesaj' : 'Profil';

      return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{modeEmoji}</span>
            <div>
              <h3 className="font-bold text-purple-300">HOYN! {typeText} QR</h3>
              <p className="text-sm text-gray-400">Kullanıcı: <span className="font-mono">@{username}</span></p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <div className="flex items-center gap-3">
           <span className="text-2xl">📱</span>
           <h3 className="font-bold text-gray-300">Standart QR</h3>
        </div>
        <p className="text-white text-sm break-all font-mono bg-gray-900 p-2 rounded mt-2">{result.data}</p>
      </div>
    );
  };

  if (hasPermission === null) return <div className="text-center p-4"><Loading text="Kamera izinleri kontrol ediliyor..." /></div>;

  if (hasPermission === false) {
    return (
      <AnimatedCard className="glass-effect p-8 rounded-xl cyber-border text-center">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-2xl font-bold text-white mb-4">Kamera İzni Gerekli</h2>
        <p className="text-gray-400 mb-6">QR kod tarayabilmek için kamera erişimine ihtiyacımız var.</p>
        <NeonButton onClick={checkCameraPermission} variant="primary" size="lg" glow>🔄 Tekrar Dene</NeonButton>
      </AnimatedCard>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
       <div className="grid lg:grid-cols-2 gap-8 items-start">
        <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
          <h2 className="text-2xl font-bold text-white mb-6 glow-text">📱 QR Tarayıcı</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 text-red-300 rounded-lg text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
            </div>
          )}
          <div className="flex gap-3 mb-6">
            {!isScanning ? (
              <NeonButton onClick={startScanning} variant="primary" size="lg" glow className="w-full">▶️ Taramayı Başlat</NeonButton>
            ) : (
              <NeonButton onClick={() => setIsScanning(false)} variant="outline" size="lg" className="w-full">⏹️ Taramayı Durdur</NeonButton>
            )}
          </div>
          <div className="relative h-64 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
          {isScanning ? (
            <div className="rounded-lg overflow-hidden w-full h-full">
              <Scanner onScan={handleScanSuccess} onError={handleScanError} formats={['qr_code']} constraints={{ facingMode: 'environment' }} scanDelay={400} />
            </div>
          ) : (
             <div className="text-center">
                <div className="text-6xl mb-2 opacity-50">📱</div>
                <p className="text-gray-400">Tarama başlatın</p>
              </div>
          )}
          </div>
        </AnimatedCard>

        <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
          <h2 className="text-2xl font-bold text-white mb-6 glow-text">📋 Sonuçlar</h2>
          {scanResult ? (
            <div className="mb-6">
              <h3 className="font-bold text-purple-300 mb-3">Son Tarama</h3>
              {renderScanResult(scanResult)}
              <div className="flex gap-3 mt-4">
                <NeonButton variant="primary" size="sm" glow onClick={() => handleQRRedirect(scanResult)}>{scanResult.isHoynQR ? '🚀 Aç' : '🔗 Bağlantıyı Aç'}</NeonButton>
                <NeonButton variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(scanResult.data)}>📋 Kopyala</NeonButton>
              </div>
            </div>
          ) : (
             <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-400">Henüz tarama yapılmadı.</p>
            </div>
          )}

          {scanHistory.length > 0 && (
            <div>
              <h3 className="font-bold text-purple-300 mb-3">Geçmiş</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scanHistory.map((scan) => (
                  <div key={scan.timestamp} className="p-3 bg-gray-800/30 rounded-lg cursor-pointer hover:border-purple-500/50 border border-transparent transition-colors" onClick={() => setScanResult(scan)}>
                    <p className="font-mono text-sm text-gray-300 truncate">
                      {scan.isHoynQR ? `HOYN QR: @${scan.hoynData?.username}` : scan.data}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  );
}