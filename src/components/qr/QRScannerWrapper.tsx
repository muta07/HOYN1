// src/components/qr/QRScannerWrapper.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Loading from '@/components/ui/Loading';

interface QRScannerWrapperProps {
  onScan: (result: string) => void;
  onError: (err: any) => void;
}

export default function QRScannerWrapper({ onScan, onError }: QRScannerWrapperProps) {
  const [Scanner, setScanner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Request camera permissions with better error handling
  const requestCameraPermission = async () => {
    try {
      // First check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      
      console.log('✅ Camera permission granted');
    } catch (err: any) {
      console.error('❌ Camera permission denied:', err);
      setHasPermission(false);
      
      let errorMessage = 'Kamera izni gerekli. Lütfen tarayıcı ayarlarından kameraya izin verin.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Kamera izni reddedildi. Lütfen sayfa ayarlarından kamera erişimini etkinleştirin.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Bu tarayıcı kamera erişimini desteklemiyor.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Kamera ayarları uygun değil. Lütfen farklı bir kamera deneyin.';
      }
      
      onError({
        message: errorMessage,
        code: err.name || 'PERMISSION_DENIED'
      });
    }
  };

  // Load scanner dynamically with better error handling
  useEffect(() => {
    let mounted = true;
    
    const loadScanner = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        console.log('🔄 Loading QR scanner...');
        
        // Try to load scanner with retries
        let retries = 3;
        let QrScanner;
        
        while (retries > 0) {
          try {
            const QrScannerModule = await import('@yudiel/react-qr-scanner');
            QrScanner = QrScannerModule.Scanner || QrScannerModule.default || QrScannerModule;
            
            // Validate that we got a valid component
            if (QrScanner && (typeof QrScanner === 'function' || typeof QrScanner === 'object')) {
              console.log('✅ QR scanner loaded successfully');
              break;
            } else {
              throw new Error('Invalid scanner component loaded');
            }
          } catch (loadError) {
            console.warn(`⚠️ QR scanner load attempt failed (${4 - retries}/3):`, loadError);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          }
        }
        
        if (mounted && QrScanner && (typeof QrScanner === 'function' || typeof QrScanner === 'object')) {
          setScanner(() => QrScanner);
          setIsLoading(false);
          
          // Auto-request camera permission
          await requestCameraPermission();
        } else {
          throw new Error('Failed to load QR scanner after retries');
        }
      } catch (error: any) {
        console.error('❌ Failed to load QR scanner:', error);
        if (mounted) {
          setIsLoading(false);
          setHasPermission(false);
          onError({
            message: 'QR tarayıcı yüklenemedi. Sayfayı yenilemeyi deneyin.',
            code: 'SCANNER_LOAD_FAILED'
          });
        }
      }
    };

    loadScanner();
    
    return () => {
      mounted = false;
    };
  }, [onError]);

  // Handle successful scan with validation
  const handleScan = (result: string) => {
    if (!result || result.trim() === '') return;
    
    console.log('🎯 QR Scanned:', result);
    
    // Validate QR content
    try {
      // Check if it's a valid URL or QR content
      if (result.startsWith('http') || result.startsWith('https')) {
        new URL(result); // Validate URL
      }
      
      // Always call the main onScan callback
      onScan(result);
      
      // Add haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]); // Pattern: vibrate-pause-vibrate
      }
      
      // Add audio feedback (optional)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (audioError) {
        // Audio feedback failed, but that's OK
        console.log('Audio feedback not available:', audioError);
      }
      
    } catch (validationError) {
      console.warn('⚠️ Invalid QR content:', validationError);
      // Still call onScan, let the parent handle invalid content
      onScan(result);
    }
  };

  // Handle scan errors
  const handleError = (error: any) => {
    console.error('QR Scan Error:', error);
    onError({
      message: error?.message || 'QR tarama hatası oluştu.',
      code: error?.name || 'SCAN_ERROR'
    });
  };

  // Toggle torch (flashlight)
  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      if (track && 'torch' in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as any]
          });
          setTorchOn(!torchOn);
        } catch (err) {
          console.error('Torch toggle failed:', err);
        }
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-64 glass-effect flex flex-col items-center justify-center cyber-border">
        <Loading size="lg" text="Kamera başlatılıyor..." />
        <p className="text-sm text-gray-400 mt-2 text-center px-4">
          📱 Kamera izni gerekebilir
        </p>
      </div>
    );
  }

  // Permission denied state - improved UI
  if (hasPermission === false) {
    return (
      <div className="w-full h-64 glass-effect flex flex-col items-center justify-center cyber-border text-center p-6">
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-white font-bold mb-2">Kamera İzni Gerekli</h3>
        <p className="text-gray-400 text-sm mb-4">
          QR kod taramak için kamera iznine ihtiyacımız var
        </p>
        
        {/* Detailed Instructions */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4 text-xs text-gray-300">
          <p className="mb-2">📝 <strong>Nasıl izin verilir:</strong></p>
          <ul className="text-left space-y-1">
            <li>• Tarayıcı adres çubuğundaki kilit simgesine tıklayın</li>
            <li>• "Kamera" seçeneğini "Izin Ver" olarak ayarlayın</li>
            <li>• Sayfayı yenileyin ve tekrar deneyin</li>
          </ul>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={requestCameraPermission}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-bold transition-colors"
          >
            🔄 Tekrar Dene
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white font-bold transition-colors"
          >
            🔄 Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  // Scanner not loaded - improved error state
  if (!Scanner) {
    return (
      <div className="w-full h-64 glass-effect flex flex-col items-center justify-center cyber-border">
        <div className="text-6xl mb-4">📱</div>
        <p className="text-white font-bold mb-2">QR Tarayıcı Hazırlanıyor...</p>
        <p className="text-gray-400 text-sm text-center px-4 mb-4">
          QR tarayıcı yüklenirken bir sorun oluştu
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-bold transition-colors"
          >
            🔄 Sayfayı Yenile
          </button>
          <button
            onClick={() => {
              setIsLoading(true);
              setHasPermission(null);
              // Retry loading scanner
              window.location.hash = '#retry';
              window.location.reload();
            }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-bold transition-colors"
          >
            ⚡ Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* QR Scanner with enhanced settings */}
      <Scanner 
        onDecode={handleScan}
        onError={handleError}
        constraints={{
          video: {
            facingMode: 'environment', // Back camera
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        }}
        videoStyle={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        containerStyle={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
        scanDelay={300}
        formats={[
          'qr_code',
          'micro_qr_code',
          'data_matrix'
        ]}
        allowMultiple={false}
      />
      
      {/* Scanning Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning Frame */}
        <div className="absolute inset-4 border-2 border-purple-500 rounded-lg">
          {/* Corner indicators */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
          
          {/* Scanning line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full inline-block">
            📱 QR kodu çerçeve içine hizalayın
          </p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={toggleTorch}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            torchOn 
              ? 'bg-yellow-500 text-black' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          title={torchOn ? 'Işığı Kapat' : 'Işığı Aç'}
        >
          {torchOn ? '🔦' : '💡'}
        </button>
      </div>
    </div>
  );
}