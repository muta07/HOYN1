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
  type: 'profile' | 'anonymous' | 'custom' | 'url' | 'other';
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
  const parseHoynQR = (data: string): { isHoyn: boolean; parsedData?: any; type: ScanResult['type'] } => {
    try {
      // Try to parse as JSON first (HOYN! format)
      const parsed = JSON.parse(data);
      
      // Validate HOYN! format
      if (parsed.hoyn && parsed.type && parsed.username) {
        return { 
          isHoyn: true, 
          parsedData: parsed,
          type: parsed.type === 'custom' ? 'custom' : parsed.type === 'anonymous' ? 'anonymous' : 'profile'
        };
      }
    } catch (e) {
      // Not JSON, check if it's a HOYN! URL
      if (data.includes('hoyn.app') || data.includes('hoyn.')) {
        return { 
          isHoyn: true, 
          parsedData: { type: 'url', url: data },
          type: 'url'
        };
      }
    }
    
    // Regular QR code
    return { isHoyn: false, type: 'other' };
  };

  // Handle successful scan - Fixed for @yudiel/react-qr-scanner v2.3.1
  const handleScanSuccess = useCallback((detectedCodes: any[]) => {
    console.log('🎯 Raw detected codes:', detectedCodes);
    
    if (!detectedCodes || detectedCodes.length === 0) {
      console.log('❌ No detected codes, ignoring');
      return;
    }

    const result = detectedCodes[0]?.rawValue || detectedCodes[0]?.data;
    
    if (!result || result.trim() === '') {
      console.log('❌ Empty scan result, ignoring');
      return;
    }

    const { isHoyn, parsedData, type } = parseHoynQR(result);
    
    const scanData: ScanResult = {
      data: result,
      timestamp: Date.now(),
      isHoynQR: isHoyn,
      parsedData,
      type
    };

    console.log('✅ QR Parsed:', { isHoyn, type, parsedData });

    setScanResult(scanData);
    setScanHistory(prev => [scanData, ...prev.slice(0, 9)]); // Keep last 10 scans
    
    // Call external handler
    onScanSuccess?.(result);

    // Auto-stop scanning after successful scan
    setIsScanning(false);

    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    console.log('✅ QR Scanned:', { isHoyn, data: result, parsedData, type });
  }, [onScanSuccess]);

  // Handle scan error with better logging
  const handleScanError = useCallback((error: unknown) => {
    const errorMsg = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Scan error:', errorMsg);
    console.error('❌ Error details:', {
      name: errorMsg.name,
      message: errorMsg.message,
      stack: errorMsg.stack
    });
    
    // Don't show every minor error to user, only critical ones
    if (errorMsg.message.includes('Permission') || 
        errorMsg.message.includes('NotAllowed') ||
        errorMsg.message.includes('NotFound')) {
      setError(`Kamera hatası: ${errorMsg.message}`);
    }
    
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

  // Start scanning with better debugging
  const startScanning = () => {
    console.log('🚀 Starting QR scan...');
    
    if (hasPermission === false) {
      console.log('⚠️ No camera permission, requesting...');
      checkCameraPermission();
      return;
    }
    
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    
    console.log('✅ Scanner started successfully');
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    setIsFlashlightOn(false);
  };

  // Render scan result
  const renderScanResult = (result: ScanResult) => {
    // HOYN! profile QR code
    if (result.isHoynQR && result.type === 'profile' && result.parsedData) {
      const { username, url } = result.parsedData;
      
      return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👤</span>
            <h3 className="font-bold text-purple-300">HOYN! Profil QR</h3>
          </div>
          <p className="text-white">Kullanıcı: <span className="font-mono">{username}</span></p>
          <p className="text-gray-400 text-sm mt-1">Profil sayfasını açmak için 'Aç' butonuna tıklayın</p>
        </div>
      );
    }
    
    // HOYN! anonymous message QR code
    if (result.isHoynQR && result.type === 'anonymous' && result.parsedData) {
      const { username, url } = result.parsedData;
      
      return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💬</span>
            <h3 className="font-bold text-purple-300">HOYN! Anonim Mesaj QR</h3>
          </div>
          <p className="text-white">Kullanıcı: <span className="font-mono">{username}</span></p>
          <p className="text-gray-400 text-sm mt-1">Anonim mesaj göndermek için 'Aç' butonuna tıklayın</p>
        </div>
      );
    }
    
    // HOYN! custom URL QR code
    if (result.isHoynQR && result.type === 'custom' && result.parsedData) {
      return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🔗</span>
            <h3 className="font-bold text-purple-300">HOYN! Özel QR</h3>
          </div>
          <p className="text-white">URL: <span className="font-mono break-all">{result.parsedData.url}</span></p>
        </div>
      );
    }
    
    // HOYN! URL QR code
    if (result.isHoynQR && result.type === 'url' && result.parsedData) {
      return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌐</span>
            <h3 className="font-bold text-purple-300">HOYN! Web QR</h3>
          </div>
          <p className="text-white">URL: <span className="font-mono break-all">{result.parsedData.url}</span></p>
        </div>
      );
    }
    
    // Regular QR code
    return (
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📱</span>
          <h3 className="font-bold text-gray-300">Standart QR</h3>
        </div>
        <p className="text-white text-sm break-all font-mono bg-gray-900 p-2 rounded">
          {result.data}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Bu bir HOYN! QR kodu değil. Kod içeriği doğrudan gösteriliyor.
        </p>
      </div>
    );
  };

  // Show loading state
  if (hasPermission === null) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <AnimatedCard className="glass-effect p-8 rounded-xl cyber-border text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-4">QR Tarayıcı Yükleniyor...</h2>
          <p className="text-gray-400 mb-6">
            Lütfen bekleyin, tarayıcı izinleri kontrol ediliyor...
          </p>
          <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 animate-pulse w-full"></div>
          </div>
        </AnimatedCard>
      </div>
    );
  }

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
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Scanner Section */}
        <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
          <h2 className="text-2xl font-bold text-white mb-6 glow-text">📱 QR <span className="text-purple-400">Tarayıcı</span></h2>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 text-red-300 rounded-lg text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
                aria-label="Hata mesajını kapat"
              >
                ✕
              </button>
            </div>
          )}

          {/* Scanner Controls */}
          <div className="flex gap-3 mb-6">
            {!isScanning ? (
              <NeonButton 
                onClick={startScanning} 
                variant="primary" 
                size="lg"
                glow
                disabled={hasPermission === null}
                className="w-full"
              >
                {hasPermission === null ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                    Yükleniyor...
                  </span>
                ) : '▶️ Taramayı Başlat'}
              </NeonButton>
            ) : (
              <>
                <NeonButton onClick={stopScanning} variant="outline" size="lg" className="w-full">
                  ⏹️ Taramayı Durdur
                </NeonButton>
                
                <NeonButton 
                  onClick={toggleFlashlight}
                  variant={isFlashlightOn ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full"
                  glow={isFlashlightOn}
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
                  formats={['qr_code', 'micro_qr_code']}
                  constraints={{
                    facingMode: 'environment',
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 }
                  }}
                  scanDelay={300}
                />
                
                {/* Custom Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-purple-400 rounded-lg animate-pulse">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-lg"></div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
                    <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                      QR kodu tarama alanına hizalayın
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2 opacity-50">📱</div>
                  <p className="text-gray-400">Tarama başlatın</p>
                </div>
              </div>
            )}
          </div>

          {/* Scanning Tips */}
          {isScanning && (
            <div className="mt-6 text-sm text-gray-400">
              <h4 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
                <span>💡</span>
                Tarama İpuçları:
              </h4>
              <ul className="space-y-1">
                <li>• QR kodu kare çerçeve içinde hizalayın</li>
                <li>• Cihazı sabit tutun ve mesafeyi ayarlayın</li>
                <li>• Yetersiz ışık varsa flaşı açın</li>
                <li>• QR kod düzgün ve temiz olmalıdır</li>
                <li className="text-purple-300">• Tarayıcı aktif ve hazır! 🟢</li>
              </ul>
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-gray-800/50 rounded text-xs">
                  <p className="text-green-400">✅ Scanner Status: Active</p>
                  <p className="text-blue-400">📹 Camera: {isFlashlightOn ? 'Flash ON' : 'Ready'}</p>
                  <p className="text-yellow-400">🔍 Detection: Listening...</p>
                </div>
              )}
            </div>
          )}
        </AnimatedCard>

        {/* Results Section */}
        <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
          <h2 className="text-2xl font-bold text-white mb-6 glow-text">📋 <span className="text-purple-400">Sonuçlar</span></h2>
          
          {/* Latest Scan Result */}
          {scanResult && (
            <div className="mb-6">
              <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                <span>🎯</span>
                Son Tarama
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(scanResult.timestamp).toLocaleTimeString('tr-TR')}
                </span>
              </h3>
              
              {renderScanResult(scanResult)}
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                {scanResult.isHoynQR && (
                  <NeonButton
                    variant="primary"
                    size="sm"
                    glow
                    onClick={() => {
                      if (scanResult.isHoynQR) {
                        const { username, url, type } = scanResult.parsedData || {};
                        let targetUrl;
                        
                        if (type === 'custom') {
                          targetUrl = url;
                        } else if (type === 'anonymous') {
                          targetUrl = `https://hoyn.app/${username}/anonymous`;
                        } else if (type === 'url') {
                          targetUrl = url;
                        } else {
                          targetUrl = `https://hoyn.app/${username}${type === 'anonymous' ? '/anonymous' : ''}`;
                        }
                        
                        if (targetUrl) {
                          window.open(targetUrl, '_blank');
                        }
                      } else {
                        // Handle regular QR codes
                        window.open(`https://hoyn.app/redirect?url=${encodeURIComponent(scanResult.data)}`, '_blank');
                      }
                    }}
                  >
                    {scanResult.isHoynQR ? '🚀 Aç' : '🔗 Bağlantıyı Aç'}
                  </NeonButton>
                )}
                
                <NeonButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(scanResult.data);
                    // Could add a toast notification
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
                Geçmiş Taramalar
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scanHistory.slice(0, 5).map((scan, index) => {
                  const { isHoyn, parsedData, type } = parseHoynQR(scan.data);
                  
                  return (
                    <div 
                      key={scan.timestamp}
                      className="p-3 bg-gray-800/30 rounded-lg border border-gray-600 hover:border-purple-500/30 transition-colors cursor-pointer"
                      onClick={() => setScanResult(scan)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isHoyn ? (
                            <>
                              {type === 'profile' && <span className="text-lg">👤</span>}
                              {type === 'anonymous' && <span className="text-lg">💬</span>}
                              {type === 'custom' && <span className="text-lg">🔗</span>}
                              {type === 'url' && <span className="text-lg">🌐</span>}
                            </>
                          ) : (
                            <span className="text-lg">📱</span>
                          )}
                          
                          <span className="font-mono text-sm text-gray-300">
                            {isHoyn && parsedData?.username 
                              ? `@${parsedData.username}` 
                              : scan.data.substring(0, 20) + (scan.data.length > 20 ? '...' : '')
                            }
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(scan.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {scanHistory.length > 5 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  +{scanHistory.length - 5} daha fazla tarama
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!scanResult && scanHistory.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
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