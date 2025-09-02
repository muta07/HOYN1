// src/components/qr/QRScanner.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface QRScannerProps {
  className?: string;
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: Error) => void;
}

interface ScanResult {
  data: string;
  timestamp: number;
  isHoynQR: boolean;
  parsedData?: any;
}

export default function QRScanner({ className = '', onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const scannerRef = useRef<any>(null);

  // Check camera permissions
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setError('Kamera erişimi gerekli. Lütfen tarayıcı ayarlarınızdan kamera iznini verin.');
    }
  };

  // Parse HOYN! QR format
  const parseHoynQR = (data: string): { isHoyn: boolean; parsedData?: any } => {
    try {
      // Try to parse as JSON first (HOYN! format)
      const parsed = JSON.parse(data);
      if (parsed.hoyn && parsed.type && parsed.username) {
        return { isHoyn: true, parsedData: parsed };
      }
    } catch (e) {
      // Not JSON, check if it's a HOYN! URL
      if (data.includes('hoyn.app') || data.includes('hoyn.')) {
        return { isHoyn: true, parsedData: { type: 'url', url: data } };
      }
    }
    
    return { isHoyn: false };
  };

  // Handle successful scan
  const handleScanSuccess = useCallback((detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
      if (!result || result.trim() === '') return;

      const { isHoyn, parsedData } = parseHoynQR(result);
      
      const scanData: ScanResult = {
        data: result,
        timestamp: Date.now(),
        isHoynQR: isHoyn,
        parsedData
      };

      setScanResult(scanData);
      setScanHistory(prev => [scanData, ...prev.slice(0, 9)]); // Keep last 10 scans
      
      // Call external handler
      onScanSuccess?.(result);

      // Auto-stop scanning after successful scan
      setIsScanning(false);

      console.log('✅ QR Scanned:', { isHoyn, data: result, parsedData });
    }
  }, [onScanSuccess]);

  // Handle scan error
  const handleScanError = useCallback((error: unknown) => {
    const errorMsg = error instanceof Error ? error : new Error(String(error));
    console.error('Scan error:', errorMsg);
    setError(`Tarama hatası: ${errorMsg.message}`);
    onScanError?.(errorMsg);
  }, [onScanError]);

  // Toggle flashlight
  const toggleFlashlight = async () => {
    if (!isScanning) return;

    try {
      // Get the video track from scanner
      const videoElement = document.querySelector('video');
      if (!videoElement?.srcObject) return;

      const stream = videoElement.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      const capabilities = track.getCapabilities();
      if ('torch' in capabilities && capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashlightOn } as any]
        });
        setIsFlashlightOn(!isFlashlightOn);
      } else {
        setError('Bu cihazda flaş desteği bulunmuyor.');
      }
    } catch (err) {
      console.error('Flashlight error:', err);
      setError('Flaş açılırken hata oluştu.');
    }
  };

  // Start scanning
  const startScanning = () => {
    if (hasPermission === false) {
      checkCameraPermission();
      return;
    }
    
    setIsScanning(true);
    setError(null);
    setScanResult(null);
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    setIsFlashlightOn(false);
  };

  // Render scan result
  const renderScanResult = (result: ScanResult) => {
    if (result.isHoynQR && result.parsedData) {
      const data = result.parsedData;
      
      if (data.type === 'profile') {
        return (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👤</span>
              <h3 className="font-bold text-purple-300">HOYN! Profil QR</h3>
            </div>
            <p className="text-white">Kullanıcı: <span className="font-mono">{data.username}</span></p>
            <p className="text-gray-400 text-sm mt-1">Profil sayfasını açmak için tıklayın</p>
          </div>
        );
      }
      
      if (data.type === 'anonymous') {
        return (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💬</span>
              <h3 className="font-bold text-purple-300">HOYN! Anonim Mesaj QR</h3>
            </div>
            <p className="text-white">Kullanıcı: <span className="font-mono">{data.username}</span></p>
            <p className="text-gray-400 text-sm mt-1">Anonim mesaj göndermek için tıklayın</p>
          </div>
        );
      }
      
      if (data.type === 'custom') {
        return (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔗</span>
              <h3 className="font-bold text-purple-300">HOYN! Özel QR</h3>
            </div>
            <p className="text-white">Kullanıcı: <span className="font-mono">{data.username}</span></p>
            <p className="text-gray-400 text-sm break-all">URL: {data.url}</p>
          </div>
        );
      }
    }

    // Regular QR or URL
    return (
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📱</span>
          <h3 className="font-bold text-gray-300">Standart QR</h3>
        </div>
        <p className="text-white text-sm break-all font-mono bg-gray-900 p-2 rounded">
          {result.data}
        </p>
      </div>
    );
  };

  // Camera permission denied
  if (hasPermission === false) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <AnimatedCard className="glass-effect p-8 rounded-xl cyber-border text-center">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-2xl font-bold text-white mb-4">Kamera İzni Gerekli</h2>
          <p className="text-gray-400 mb-6">
            QR kod tarayabilmek için kamera erişimine ihtiyacımız var. 
            Lütfen tarayıcı ayarlarınızdan kamera iznini verin.
          </p>
          <NeonButton onClick={checkCameraPermission} variant="primary" size="lg" glow>
            🔄 Tekrar Dene
          </NeonButton>
          
          {/* Help for different browsers */}
          <div className="mt-6 text-left">
            <h3 className="font-bold text-purple-300 mb-2">Yardım:</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• <strong>Chrome/Edge:</strong> Adres çubuğundaki kamera ikonu → İzin ver</p>
              <p>• <strong>Safari:</strong> Safari → Site Ayarları → Kamera → İzin ver</p>
              <p>• <strong>WhatsApp/Instagram:</strong> Ayarlar → Gizlilik → Kamera → İzin ver</p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Scanner Section */}
        <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
          <h2 className="text-2xl font-bold text-white mb-6 glow-text">📱 QR Tarayıcı</h2>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 text-red-300 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Scanner Controls */}
          <div className="flex gap-3 mb-4">
            {!isScanning ? (
              <NeonButton 
                onClick={startScanning}
                variant="primary" 
                size="md"
                glow
                disabled={hasPermission === null}
              >
                {hasPermission === null ? <Loading size="sm" text="" /> : '▶️ Taramayı Başlat'}
              </NeonButton>
            ) : (
              <>
                <NeonButton onClick={stopScanning} variant="outline" size="md">
                  ⏹️ Durdur
                </NeonButton>
                <NeonButton 
                  onClick={toggleFlashlight}
                  variant={isFlashlightOn ? 'primary' : 'outline'}
                  size="md"
                >
                  {isFlashlightOn ? '🔦 Flaş Açık' : '💡 Flaş'}
                </NeonButton>
              </>
            )}
          </div>

          {/* Scanner View */}
          <div className="relative">
            {isScanning ? (
              <div className="rounded-lg overflow-hidden border-2 border-purple-500/30 relative">
                <Scanner
                  onScan={handleScanSuccess}
                  onError={handleScanError}
                  constraints={{
                    facingMode: 'environment'
                  }}
                />
                {/* Custom Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-purple-400 rounded-lg animate-pulse">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-lg"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
                  <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    QR kodu tarama alanına hizalayın
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-gray-900 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2 opacity-50">📱</div>
                  <p className="text-gray-400">Taramayı başlatın</p>
                </div>
              </div>
            )}
          </div>

          {/* Scanning Tips */}
          {isScanning && (
            <div className="mt-4 text-sm text-gray-400">
              <h4 className="font-bold text-purple-300 mb-2">💡 Tarama İpuçları:</h4>
              <ul className="space-y-1">
                <li>• QR kodu kare çerçeve içinde hizalayın</li>
                <li>• Cihazı sabit tutun ve mesafeyi ayarlayın</li>
                <li>• Yetersiz ışık varsa flaşı açın</li>
                <li>• QR kod düzgün ve temiz olmalıdır</li>
              </ul>
            </div>
          )}
        </AnimatedCard>

        {/* Results Section */}
        <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
          <h2 className="text-2xl font-bold text-white mb-6 glow-text">📋 Sonuçlar</h2>
          
          {/* Latest Scan Result */}
          {scanResult && (
            <div className="mb-6">
              <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                <span>🎯</span>
                Son Tarama
                <span className="text-xs text-gray-400">
                  ({new Date(scanResult.timestamp).toLocaleTimeString('tr-TR')})
                </span>
              </h3>
              
              {renderScanResult(scanResult)}
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                {scanResult.isHoynQR && scanResult.parsedData?.username && (
                  <NeonButton
                    variant="primary"
                    size="sm"
                    glow
                    onClick={() => {
                      const username = scanResult.parsedData.username;
                      const type = scanResult.parsedData.type;
                      const url = type === 'custom' 
                        ? scanResult.parsedData.url 
                        : `https://hoyn.app/${username}${type === 'anonymous' ? '/anonymous' : ''}`;
                      window.open(url, '_blank');
                    }}
                  >
                    🚀 Aç
                  </NeonButton>
                )}
                
                <NeonButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(scanResult.data);
                    // Could add a toast notification here
                  }}
                >
                  📋 Kopyala
                </NeonButton>
              </div>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div>
              <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                <span>📚</span>
                Tarama Geçmişi
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scanHistory.slice(0, 5).map((scan, index) => (
                  <div 
                    key={scan.timestamp}
                    className="p-3 bg-gray-800/30 rounded-lg border border-gray-600 hover:border-purple-500/30 transition-colors cursor-pointer"
                    onClick={() => setScanResult(scan)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{scan.isHoynQR ? '🎆' : '📱'}</span>
                        <span className="font-mono text-sm text-gray-300">
                          {scan.isHoynQR && scan.parsedData?.username 
                            ? `@${scan.parsedData.username}` 
                            : scan.data.substring(0, 20) + (scan.data.length > 20 ? '...' : '')
                          }
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {scanHistory.length > 5 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  +{scanHistory.length - 5} daha fazla tarama...
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!scanResult && scanHistory.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 opacity-50">🔍</div>
              <p className="text-gray-400">Henüz QR taraması yapılmadı</p>
              <p className="text-sm text-gray-500 mt-1">
                İlk QR kodunuzu tarayın ve sonuçlar burada görünsün
              </p>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  );
}