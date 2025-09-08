'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '@/hooks/useAuth';
import { getProfileBySlug, getProfileById, incrementProfileStats } from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';

interface QRScannerProps {
  className?: string;
}

interface ScanResult {
  data: string;
  timestamp: number;
  profileId?: string;
  slug?: string; // Add slug to support new URL format
}

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [scanner, setScanner] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
      setError('Kamera erişimi gerekli. Lütfen tarayıcı ayarlarından kamera iznini verin.');
    }
  };

  const startScanning = () => {
    if (hasPermission === false) {
      checkCameraPermission();
      return;
    }

    const html5QrCode = new (window as any).Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        facingMode: "environment"
      },
      false
    );

    setScanner(html5QrCode);
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setIsRedirecting(false);

    html5QrCode.render(handleScanSuccess, handleScanError);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
    setFlashlightOn(false);
  };

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    if (!decodedText || decodedText.trim() === '') return;

    // Parse QR data for profile ID or slug
    let profileId: string | undefined;
    let slug: string | undefined;
    
    // Check if it's a HOYN profile URL format: https://domain/p/{slug}
    try {
      const url = new URL(decodedText);
      // Check for new format: /p/{slug}
      if (url.pathname.startsWith('/p/')) {
        slug = url.pathname.split('/p/')[1].split('?')[0];
      }
      // Also check for old format: /u/{profileId} for backward compatibility
      else if (url.pathname.startsWith('/u/')) {
        profileId = url.pathname.split('/u/')[1].split('?')[0];
      }
    } catch (e) {
      console.log('Not a valid URL format');
    }

    const scanData: ScanResult = {
      data: decodedText,
      timestamp: Date.now(),
      profileId: profileId,
      slug: slug
    };

    setScanResult(scanData);
    stopScanning();
    
    if ('vibrate' in navigator) navigator.vibrate(200);
  };

  const handleScanError = (error: unknown) => {
    const errorMsg = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Scan error:', errorMsg);
    if (errorMsg.message.includes('Permission') || errorMsg.message.includes('NotAllowed')) {
      setError('Kamera erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
    } else if (errorMsg.message.includes('NotFound')) {
      setError('Kamera bulunamadı. Farklı bir cihaz deneyin.');
    } else {
      setError('Tarama hatası: ' + errorMsg.message);
    }
  };

  const handleScanRedirect = async (scanData: ScanResult) => {
    // Need either slug (new format) or profileId (old format)
    if (!scanData.slug && !scanData.profileId) {
      setError('Invalid QR Code. Please generate with HOyN app.');
      return;
    }

    setIsRedirecting(true);
    setError(null);

    try {
      let profile = null;
      
      // Try to get profile by slug first (new format)
      if (scanData.slug) {
        profile = await getProfileBySlug(scanData.slug);
      }
      
      // If not found and we have profileId, try old format
      if (!profile && scanData.profileId) {
        profile = await getProfileById(scanData.profileId);
      }
      
      if (!profile) {
        setError('Bu QR kodu geçersiz veya profile silinmiş.');
        setIsRedirecting(false);
        return;
      }

      // Increment scan stats
      await incrementProfileStats(profile.id, 'scans', 1);

      // Call scan API for additional tracking
      try {
        await fetch('/api/scan-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrData: scanData.data,
            profileId: profile.id
          })
        });
      } catch (apiError) {
        console.error('Failed to track scan via API:', apiError);
      }

      // Redirect to profile page using the new slug-based URL
      router.push(`/p/${profile.slug}`);

    } catch (error) {
      console.error('Redirect error:', error);
      setError('Profile yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      setIsRedirecting(false);
    }
  };

  // Add image upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Parse QR code from uploaded image
        try {
          const html5QrCode = new (window as any).Html5Qrcode("qr-reader-upload");
          const decodedText = await html5QrCode.scanFile(file, true);
          if (decodedText) {
            // Parse QR data for profile ID or slug
            let profileId: string | undefined;
            let slug: string | undefined;
            
            // Check if it's a HOYN profile URL format: https://domain/p/{slug}
            try {
              const url = new URL(decodedText);
              // Check for new format: /p/{slug}
              if (url.pathname.startsWith('/p/')) {
                slug = url.pathname.split('/p/')[1].split('?')[0];
              }
              // Also check for old format: /u/{profileId} for backward compatibility
              else if (url.pathname.startsWith('/u/')) {
                profileId = url.pathname.split('/u/')[1].split('?')[0];
              }
            } catch (e) {
              console.log('Not a valid URL format');
            }

            // Process the scanned result
            const scanData: ScanResult = {
              data: decodedText,
              timestamp: Date.now(),
              profileId: profileId,
              slug: slug
            };
            setScanResult(scanData);
            handleScanRedirect(scanData);
          } else {
            setError('Bu resimde okunabilir QR kodu bulunamadı.');
          }
          html5QrCode.clear(); // Clean up
        } catch (scanError) {
          console.error('Image scan error:', scanError);
          setError('QR kodu resimden okunamadı. Lütfen başka bir resim deneyin.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFlashlight = () => {
    // Simplified flashlight toggle - actual torch control requires more complex implementation
    // For now, just provide visual feedback. Real implementation would need custom video element
    setFlashlightOn(!flashlightOn);
    if (!flashlightOn) {
      setError('Bu tarayıcıda flaş özelliği sınırlı. Düşük ışıkta telefon kamerasını kullanın.');
    }
  };

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <Loading text="Kamera hazırlanıyor..." />
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6">📷</div>
        <h2 className="text-2xl font-bold text-white mb-4 text-center glow-text">Kamera İzni Gerekli</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">QR kod tarayabilmek için tarayıcınızın kamera erişimine izin vermesi gerekiyor.</p>
        <div className="space-y-3">
          <button 
            onClick={checkCameraPermission}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all glow-subtle"
          >
            🔄 İzin Ver & Devam Et
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 border border-gray-600 hover:border-purple-400 text-gray-300 rounded-lg font-medium transition-all"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>
        <div className="mt-8 p-6 glass-effect rounded-xl cyber-border max-w-md w-full">
          <h3 className="text-lg font-bold text-white mb-4 text-center">QR Kod Resmi Yükle</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
          />
          <p className="text-sm text-gray-400 mt-2 text-center">QR kod içeren bir resim yükleyin</p>
        </div>
      </div>
    );
  }

  if (error && !isScanning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6 text-red-400">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-4 text-center glow-text">Tarama Hatası</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">{error}</p>
        <div className="space-y-3">
          <button 
            onClick={startScanning}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all glow-subtle"
          >
            🔄 Tekrar Dene
          </button>
          <button 
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="px-8 py-3 border border-gray-600 hover:border-purple-400 text-gray-300 rounded-lg font-medium transition-all"
          >
            📁 Resim Yükle
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 border border-gray-600 hover:border-purple-400 text-gray-300 rounded-lg font-medium transition-all"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>
        {showImageUpload && (
          <div className="mt-8 p-6 glass-effect rounded-xl cyber-border max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4 text-center">QR Kod Resmi Yükle</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
            />
            <p className="text-sm text-gray-400 mt-2 text-center">QR kod içeren bir resim yükleyin</p>
            <NeonButton
              onClick={() => setShowImageUpload(false)}
              variant="outline"
              size="sm"
              className="mt-4 w-full"
            >
              İptal
            </NeonButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-white hover:text-purple-400 transition-colors p-2 rounded-full bg-black/50 glow-subtle"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-white text-center flex-1">📱 QR Tarayıcı</h1>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Scanner Container */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
        {isScanning ? (
          <>
            {/* Camera View with Neon Border */}
            <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl cyber-border-glow">
              <div id="qr-reader" className="w-full h-full"></div>
              
              {/* Scan Animation Overlay with Neon Effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Scanning frame with neon border */}
                  <div className="w-64 h-64 border-4 border-purple-500 rounded-2xl p-1 neon-border-pulse">
                    <div className="w-full h-full bg-transparent rounded-xl relative overflow-hidden">
                      {/* Corner decorations with neon effect */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-400 rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-pink-400 rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-400 rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-pink-400 rounded-br-xl"></div>
                      
                      {/* Scanning line animation with neon effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-scan-line-neon"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scanning text with neon effect */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-purple-400 text-sm font-medium tracking-wide animate-pulse glow-text">QR Kodu Taranıyor</div>
                    <div className="text-pink-400 text-xs mt-1 opacity-75">QR kodunu merkeze yerleştirin</div>
                  </div>
                </div>
              </div>
              
              {/* Flashlight Toggle with Neon Effect */}
              {flashlightOn ? (
                <button
                  onClick={toggleFlashlight}
                  className="absolute bottom-4 right-4 p-3 bg-yellow-500/20 border border-yellow-400 rounded-full text-yellow-300 hover:bg-yellow-500/30 transition-all glow-subtle"
                  title="Flaş"
                >
                  <span className="text-xl">💡</span>
                </button>
              ) : (
                <button
                  onClick={toggleFlashlight}
                  className="absolute bottom-4 right-4 p-3 bg-gray-800/50 border border-gray-600 rounded-full text-gray-300 hover:bg-gray-700/50 transition-all hover:border-purple-400"
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
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-lg font-medium transition-all glow-subtle"
              >
                ⏹️ Taramayı Durdur
              </button>
              
              <button
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all glow-subtle"
              >
                📁 Resim Yükle
              </button>
              
              {showImageUpload && (
                <div className="p-4 glass-effect rounded-lg cyber-border">
                  <h3 className="text-lg font-bold text-white mb-2">QR Kod Resmi Yükle</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">QR kod içeren bir resim yükleyin</p>
                </div>
              )}
              
              {scanResult && (
                <div className={`p-4 rounded-lg text-center transition-all duration-300 ${
                  scanResult.slug || scanResult.profileId
                    ? 'bg-green-900/30 border border-green-500/50 text-green-300 glow-subtle' 
                    : 'bg-red-900/30 border border-red-500/50 text-red-300'
                }`}>
                  {scanResult.slug || scanResult.profileId ? (
                    <>
                      <div className="text-2xl mb-2">✅</div>
                      <p className="font-medium">Profile bulundu!</p>
                      <p className="text-sm opacity-75">
                        {scanResult.slug ? `Slug: ${scanResult.slug}` : `ID: ${scanResult.profileId}`}
                      </p>
                      {isRedirecting && <p className="text-xs mt-2 animate-pulse">Yönlendiriliyor...</p>}
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
            <div className="text-8xl mb-6 opacity-50 animate-bounce">📱</div>
            <h2 className="text-2xl font-bold text-white mb-4 glow-text">QR Kod Tarayıcı</h2>
            <p className="text-gray-400 mb-8 max-w-sm">QR kodlarınızı tarayarak profillere hızlıca erişin</p>
            <div className="space-y-4">
              <button
                onClick={startScanning}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:scale-105 glow-intense"
              >
                ▶️ Taramayı Başlat
              </button>
              
              <button
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:scale-105 glow-intense"
              >
                📁 Resim Yükle
              </button>
              
              {showImageUpload && (
                <div className="p-6 glass-effect rounded-xl cyber-border max-w-md mx-auto animate-fade-in">
                  <h3 className="text-lg font-bold text-white mb-4">QR Kod Resmi Yükle</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <p className="text-sm text-gray-400 mt-2">QR kod içeren bir resim yükleyin</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Scanning Animation CSS */}
      <style jsx>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        
        @keyframes scan-line-neon {
          0% { 
            transform: translateY(-100%); 
            opacity: 1;
            box-shadow: 0 0 10px #a855f7, 0 0 20px #a855f7;
          }
          100% { 
            transform: translateY(100%); 
            opacity: 0;
            box-shadow: 0 0 5px #a855f7, 0 0 10px #a855f7;
          }
        }
        
        @keyframes neon-border-pulse {
          0% { box-shadow: 0 0 5px #a855f7, 0 0 10px #a855f7; }
          50% { box-shadow: 0 0 10px #a855f7, 0 0 20px #a855f7; }
          100% { box-shadow: 0 0 5px #a855f7, 0 0 10px #a855f7; }
        }
        
        .animate-scan-line-neon {
          animation: scan-line-neon 2s linear infinite;
        }
        
        .neon-border-pulse {
          animation: neon-border-pulse 2s linear infinite;
        }
        
        .cyber-border-glow {
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}