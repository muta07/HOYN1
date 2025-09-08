'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAuth } from '@/hooks/useAuth';
import { getProfileBySlug } from '@/lib/firebase';
import Loading from '@/components/ui/Loading';

interface QRScannerProps {
  className?: string;
}

interface ScanResult {
  data: string;
  timestamp: number;
  slug?: string;
  qrId?: string; // Fix type to be optional string instead of string | null
}

export default function QRScanner({ className = '' }: QRScannerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  useEffect(() => {
    if (scanResult && !isRedirecting) {
      handleScanRedirect(scanResult);
    }
  }, [scanResult, isRedirecting]);

  const checkCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Bu tarayıcı kamera erişimini desteklemiyor.');
      setHasPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setError('Kamera erişimi gerekli. Lütfen tarayıcı ayarlarınızdan kamera iznini verin.');
    }
  };

  const toggleFlashlight = () => {
    // Simplified flashlight toggle - actual torch control requires more complex implementation
    // For now, just provide visual feedback. Real implementation would need custom video element
    setFlashlightOn(!flashlightOn);
    if (!flashlightOn) {
      setError('Bu tarayıcıda flaş özelliği sınırlı. Düşük ışıkta telefon kamerasını kullanın.');
    }
  };

  const handleScanSuccess = useCallback((detectedCodes: any[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const result = detectedCodes[0]?.rawValue || detectedCodes[0]?.data;
    if (!result || result.trim() === '') return;

    // Parse QR data for profile slug and QR ID
    let slug: string | undefined = undefined;
    let qrId: string | undefined = undefined;
  
    // Check if it's a HOYN profile URL format: https://domain/p/slug?src=hoyn
    try {
      const url = new URL(result);
      if (url.pathname.startsWith('/p/')) {
        const pathParts = url.pathname.split('/p/');
        if (pathParts.length > 1) {
          slug = pathParts[1].split('?')[0];
        }
    }
    
    // Extract QR ID from query parameters if present
    try {
      const qrIdParam = url.searchParams.get('qrId');
      if (qrIdParam && qrIdParam.trim() !== '') {
        qrId = qrIdParam;
      }
    } catch (paramError) {
      console.warn('Failed to extract qrId parameter:', paramError);
    }
    
    // Also check for src parameter to verify it's a HOYN QR
    try {
      const srcParam = url.searchParams.get('src');
      if (srcParam === 'hoyn') {
        // This is a HOYN QR code
        console.log('HOYN QR code detected');
      }
    } catch (paramError) {
      console.warn('Failed to extract src parameter:', paramError);
    }
  } catch (urlError) {
    console.warn('Scanned data is not a valid URL:', result);
    // Not a valid URL, try HOYN custom format: hoyn:slug:profileType
    if (result.startsWith('hoyn:')) {
      const parts = result.split(':');
      if (parts.length >= 2) {
        slug = parts[1];
      }
    }
  }

  const scanData: ScanResult = {
    data: result,
    timestamp: Date.now(),
    slug: slug,
    qrId: qrId // Include QR ID for validation
  };

  setScanResult(scanData);
  setIsScanning(false);
  
  if ('vibrate' in navigator) navigator.vibrate(200);
  
  // Stop flashlight if it was on
  if (flashlightOn) {
    setFlashlightOn(false);
  }
}, [flashlightOn]);

  const handleScanError = useCallback((error: unknown) => {
    const errorMsg = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Scan error:', errorMsg);
    if (errorMsg.message.includes('Permission') || errorMsg.message.includes('NotAllowed')) {
      setError('Kamera erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
    } else if (errorMsg.message.includes('NotFound')) {
      setError('Kamera bulunamadı. Farklı bir cihaz deneyin.');
    } else {
      setError('Tarama hatası: ' + errorMsg.message);
    }
  }, []);

  const handleScanRedirect = async (scanData: ScanResult) => {
    setIsRedirecting(true);
    setError(null);

    try {
      // If we have a QR ID, validate it first
      if (scanData.qrId) {
        try {
          const validationResponse = await fetch('/api/qr/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrId: scanData.qrId })
          });

          // Check if the response is ok
          if (!validationResponse.ok) {
            // Try to parse the error response
            let errorMessage = 'QR validation failed';
            try {
              const errorText = await validationResponse.text();
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            
              if (validationResponse.status === 400 && errorData.type === 'already_used') {
                setError('Bu QR kodu daha önce kullanılmış.');
                setIsRedirecting(false);
                return;
              }
            } catch (parseError) {
              // If we can't parse the error, use the status text
              errorMessage = `QR validation failed: ${validationResponse.statusText}`;
            }

            setError('QR kodu doğrulanamadı: ' + errorMessage);
            setIsRedirecting(false);
            return;
          }

          // Parse successful response
          const validationResult = await validationResponse.json();

          // If validation successful, use the redirect URL from the response
          if (validationResult.redirectUrl) {
            window.location.href = validationResult.redirectUrl;
            return;
          }
        } catch (validationError: any) {
          console.error('QR validation API error:', validationError);
          // If it's a network error, show a more user-friendly message
          if (validationError instanceof TypeError) {
            setError('QR doğrulama servisine erişilemiyor. Lütfen internet bağlantınızı kontrol edin.');
          } else {
            setError('QR kodu doğrulanamadı: ' + (validationError.message || 'Unknown error'));
          }
          // Continue with fallback logic even if validation fails
        }
      }

      // Fallback to original logic if no QR ID or validation failed
      if (!scanData.slug) {
        setError('Bu QR kodu herhangi bir profile ait değil.');
        setIsRedirecting(false);
        return;
      }

      // Verify profile exists and get its details
      const profile = await getProfileBySlug(scanData.slug);
    
      if (!profile) {
        setError('Bu QR kodu geçersiz veya profile silinmiş.');
        setIsRedirecting(false);
        return;
      }

      // Track the scan
      if (user && profile.id) {
        // Call API to track scan (will be implemented later)
        try {
          await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileId: profile.id,
              slug: profile.slug,
              userAgent: navigator.userAgent,
              src: 'scanner'
            })
          });
        } catch (trackError) {
          console.error('Failed to track scan:', trackError);
        }
      }

      // Redirect based on profile type
      if (profile.type === 'business') {
        // Direct redirect for business profiles
        router.push(`/p/${profile.slug}`);
      } else {
        // Show gate page for non-business profiles
        router.push(`/gate?slug=${profile.slug}`);
      }

    } catch (error: any) {
      console.error('Redirect error:', error);
      setError('Profile yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      setIsRedirecting(false);
    }
  };

  const startScanning = () => {
    if (hasPermission === false) {
      checkCameraPermission();
      return;
    }
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setIsRedirecting(false);
  };

  const stopScanning = () => {
    setIsScanning(false);
    setFlashlightOn(false);
  };

  const renderScanAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {/* Scanning frame */}
        <div className="w-64 h-64 border-4 border-purple-500/30 rounded-2xl p-1">
          <div className="w-full h-full bg-transparent rounded-xl relative overflow-hidden">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-400 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-pink-400 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-400 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-pink-400 rounded-br-xl"></div>
            
            {/* Scanning line animation */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-scan-line"></div>
            </div>
          </div>
        </div>
        
        {/* Scanning text */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-purple-400 text-sm font-medium tracking-wide animate-pulse">QR Kodu Taranıyor</div>
          <div className="text-pink-400 text-xs mt-1 opacity-75">QR kodunu merkeze yerleştirin</div>
        </div>
      </div>
    </div>
  );

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Kamera hazırlanıyor..." />
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6">📷</div>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Kamera İzni Gerekli</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">QR kod tarayabilmek için tarayıcınızın kamera erişimine izin vermesi gerekiyor.</p>
        <div className="space-y-3">
          <button 
            onClick={checkCameraPermission}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 İzin Ver & Devam Et
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg font-medium transition-colors"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (error && !isScanning) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6 text-red-400">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-4 text-center">Tarama Hatası</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">{error}</p>
        <div className="space-y-3">
          <button 
            onClick={startScanning}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Tekrar Dene
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg font-medium transition-colors"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black relative ${className}`}>
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-white hover:text-purple-400 transition-colors p-2 rounded-full bg-black/50"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-white text-center flex-1">QR Tarayıcı</h1>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Scanner Container */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
        {isScanning ? (
          <>
            {/* Camera View */}
            <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <Scanner 
                onScan={handleScanSuccess}
                onError={handleScanError}
                formats={['qr_code']}
                constraints={{ facingMode: 'environment' }}
                scanDelay={300}
                classNames={{ container: 'w-full h-full' }}
              />
              
              {/* Scan Animation Overlay */}
              {renderScanAnimation()}
              
              {/* Flashlight Toggle */}
              {flashlightOn ? (
                <button
                  onClick={toggleFlashlight}
                  className="absolute bottom-4 right-4 p-3 bg-yellow-500/20 border border-yellow-400 rounded-full text-yellow-300 hover:bg-yellow-500/30 transition-all"
                  title="Flaş"
                >
                  <span className="text-xl">💡</span>
                </button>
              ) : (
                <button
                  onClick={toggleFlashlight}
                  className="absolute bottom-4 right-4 p-3 bg-gray-800/50 border border-gray-600 rounded-full text-gray-300 hover:bg-gray-700/50 transition-all"
                  title="Flaş"
                >
                  <span className="text-xl">🔦</span>
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="mt-6 space-y-3 w-full max-w-lg">
              <button
                onClick={stopScanning}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                ⏹️ Taramayı Durdur
              </button>
              
              {scanResult && (
                <div className={`p-4 rounded-lg text-center ${
                  scanResult.slug 
                    ? 'bg-green-900/30 border border-green-500/50 text-green-300' 
                    : 'bg-red-900/30 border border-red-500/50 text-red-300'
                }`}>
                  {scanResult.slug ? (
                    <>
                      <div className="text-2xl mb-2">✅</div>
                      <p className="font-medium">Profile bulundu!</p>
                      <p className="text-sm opacity-75">{scanResult.slug}</p>
                      {isRedirecting && <p className="text-xs mt-2">Yönlendiriliyor...</p>}
                    </>
                  ) : (
                    <>
                      <div className="text-2xl mb-2">❌</div>
                      <p className="font-medium">Geçersiz QR Kodu</p>
                      <p className="text-sm opacity-75">Bu QR kodu herhangi bir profile ait değil.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-8xl mb-6 opacity-50">📱</div>
            <h2 className="text-2xl font-bold text-white mb-4">QR Kod Tarayıcı</h2>
            <p className="text-gray-400 mb-8 max-w-sm">QR kodlarınızı tarayarak profillere hızlıca erişin</p>
            <button
              onClick={startScanning}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              ▶️ Taramayı Başlat
            </button>
          </div>
        )}
      </div>

      {/* Scanning Animation CSS */}
      <style jsx>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
