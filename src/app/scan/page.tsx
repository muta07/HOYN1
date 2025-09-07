'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import QRScannerWrapper from '@/components/qr/QRScannerWrapper';
import { 
  trackQRScan,
  decryptHOYNQR,
  isHOYNQR
} from '@/lib/firebase';
import { parseHOYNQR } from '@/lib/qr-utils';
import { incrementProfileViews } from '@/lib/stats';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';

export default function ScanPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isHOYNQRCode, setIsHOYNQRCode] = useState<boolean | null>(null);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (data: string) => {
    setScannedData(data);
    setScanning(false);
    
    // Check if it's a HOYN QR
    const isHOYN = isHOYNQR(data);
    setIsHOYNQRCode(isHOYN);
    
    if (isHOYN) {
      // Decrypt HOYN QR
      const decrypted = decryptHOYNQR(data);
      if (decrypted) {
        try {
          const parsed = JSON.parse(decrypted);
          setDecryptedData(parsed);
          
          // Track scan
          trackQRScan(currentUser?.uid || '', parsed.username || '', 'HOYN').catch(console.error);
          
          // Navigate to profile
          if (parsed.username) {
            router.push(`/u/${parsed.username}`);
          }
        } catch (err) {
          console.error('Failed to parse HOYN QR:', err);
          setError('Şifreli QR kodu okunamadı');
        }
      }
    } else {
      // Non-HOYN QR - show warning
      setShowWarning(true);
      trackQRScan(currentUser?.uid || '', 'unknown', 'NON-HOYN').catch(console.error);
    }
  };

  const handleConfirmNonHOYN = () => {
    if (scannedData) {
      // For non-HOYN QRs, try to navigate to the URL if it's a valid URL
      try {
        const url = new URL(scannedData);
        window.open(url.href, '_blank');
      } catch {
        // If not a valid URL, show error
        setError('Bu QR kod geçerli bir URL içermiyor');
      }
    }
    setShowWarning(false);
  };

  const handleCancelNonHOYN = () => {
    setShowWarning(false);
    setScannedData(null);
    setIsHOYNQRCode(null);
    setDecryptedData(null);
    setError(null);
  };

  const handleStartScan = () => {
    setScanning(true);
    setScannedData(null);
    setIsHOYNQRCode(null);
    setDecryptedData(null);
    setError(null);
    setShowWarning(false);
  };

  if (scanning) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <QRScannerWrapper
          onScan={handleScan}
          onError={(err) => {
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
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4">
            HOYN QR Tarayıcı 🔍
          </h1>
          <p className="text-lg text-gray-300">
            HOYN şifreli QR kodlarını tarayın ve profil sayfalarına ulaşın
          </p>
        </div>

        {/* Scanner Button */}
        <div className="text-center mb-8">
          <NeonButton
            onClick={handleStartScan}
            variant="primary"
            size="lg"
            glow
            className="w-full max-w-sm"
          >
            📱 QR Kod Tarat
          </NeonButton>
          <p className="text-sm text-gray-400 mt-2">
            Kamerayı aç ve QR kodunu tarat
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8">
          <AnimatedCard direction="up" className="p-6">
            <h3 className="text-xl font-bold text-purple-300 mb-3">Nasıl Kullanılır?</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>🔐 <strong>HOYN QR Kodları:</strong> Sadece HOYN tarayıcı ile okunabilir</p>
              <p>🔒 <strong>Şifreli Koruma:</strong> Diğer tarayıcılar uyarı gösterir</p>
              <p>👤 <strong>Profil Sayfası:</strong> Doğru profiline yönlendirir</p>
              <p>📱 <strong>Mobil Uyumlu:</strong> Telefon kamerası ile çalışır</p>
            </div>
          </AnimatedCard>
        </div>

        {/* Security Features */}
        <div className="space-y-4 mb-8">
          <AnimatedCard direction="up" className="p-6 bg-purple-900/10">
            <h3 className="text-lg font-bold text-purple-300 mb-3">Güvenlik Özellikleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                <span>Şifreli Veri</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <span>HOYN Doğrulama</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span>Tarama İstatistikleri</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span>Gizli Profil Koruma</span>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>HOYN QR Tarayıcı - Güvenli Profil Paylaşımı</p>
          <p className="mt-1">© 2025 HOYN Teknoloji</p>
        </div>
      </div>
    </div>
  );
}
