// src/components/qr/CanvasQRCode.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useTheme } from 'next-themes';

interface CanvasQRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  logo?: string;
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export default function CanvasQRCode({
  value,
  size = 256,
  bgColor = '#000000',
  fgColor = '#E040FB',
  logo,
  className = '',
  onReady,
  onError
}: CanvasQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isQRReady, setIsQRReady] = useState(false);
  const [progress, setProgress] = useState(0);

  // Validate QR value
  useEffect(() => {
    setError(null);
    if (!value || value.trim() === '') {
      setError('QR değeri geçersiz');
    }
  }, [value]);

  // Initialize canvas
  useEffect(() => {
    if (!isInitialized && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set fixed canvas size
        canvas.width = size;
        canvas.height = size;
        
        // Initial background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
        
        setIsInitialized(true);
      }
    }
  }, [size, bgColor, isInitialized]);

  // Generate QR code with progress indicator
  useEffect(() => {
    const drawQRCode = async () => {
      if (error || !value || !canvasRef.current || !isInitialized) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setProgress(0);
      
      try {
        const canvas = canvasRef.current;
        const canvasContext = canvas.getContext('2d');
        
        if (!canvasContext) {
          throw new Error('Canvas context oluşturulamadı');
        }

        // Clear previous content
        canvasContext.clearRect(0, 0, size, size);
        canvasContext.fillStyle = bgColor;
        canvasContext.fillRect(0, 0, size, size);
        
        // Add sand clock icon during loading
        canvasContext.font = `${size * 0.2}px Orbitron`;
        canvasContext.fillStyle = fgColor;
        canvasContext.textAlign = 'center';
        canvasContext.textBaseline = 'middle';
        canvasContext.fillText('⏳', size / 2, size / 2);
        
        // Update progress
        setProgress(30);
        
        // Generate QR code with custom colors
        const qrCanvas = await QRCode.toCanvas(value, {
          width: size,
          color: {
            dark: fgColor,
            light: bgColor
          }
        });
        
        // Update progress
        setProgress(70);
        
        // Draw the QR code on our canvas
        canvasContext.clearRect(0, 0, size, size);
        canvasContext.fillStyle = bgColor;
        canvasContext.fillRect(0, 0, size, size);
        canvasContext.drawImage(qrCanvas, 0, 0, size, size);
        
        // Update progress
        setProgress(100);
        setIsQRReady(true);
        
        // QR code is ready - call onReady if no logo
        if (!logo && onReady) {
          onReady();
        }
        
        // Add logo if provided
        if (logo) {
          const logoImage = new Image();
          logoImage.src = logo;
          
          logoImage.onload = () => {
            try {
              const logoSize = size * 0.2;
              const x = (size - logoSize) / 2;
              const y = (size - logoSize) / 2;
              
              // Clear center area for logo
              canvasContext.fillStyle = bgColor;
              canvasContext.fillRect(x, y, logoSize, logoSize);
              
              // Draw logo
              canvasContext.drawImage(logoImage, x, y, logoSize, logoSize);
              
              setIsQRReady(true);
              
              // Call onReady if provided (QR with logo is now ready)
              if (onReady) {
                onReady();
              }
            } catch (err) {
              console.error('Logo çizim hatası:', err);
              setError('Logo eklenemedi');
              
              // Call onError if provided
              if (onError && err instanceof Error) {
                onError(err);
              }
            }
          };
          
          logoImage.onerror = () => {
            console.error('Logo yükleme hatası');
            setError('Logo yüklenemedi');
            
            // Call onError if provided
            if (onError) {
              onError(new Error('Logo yükleme hatası'));
            }
          };
        }
      } catch (error) {
        console.error('QR kodu oluşturma hatası:', error);
        setError('QR kodu oluşturulamadı');
        
        // Call onError if provided
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    drawQRCode();
  }, [value, size, bgColor, fgColor, logo, isInitialized, error]);

  const downloadQR = () => {
    if (error) {
      console.error('QR indirme hatası: QR kodu oluşturulam adı');
      setError('QR indirilemedi: QR kodu oluşturulam adı');
      return;
    }
    
    if (!isQRReady) {
      console.error('QR indirme hatası: QR henüz hazır değil');
      setError('QR indirilemedi: QR henüz hazırlanmadı. Lütfen bekleyin.');
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas bulunamadı');
      setError('QR indirilemedi: Canvas bulunamadı');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `hoyn-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('QR indirme hatası:', error);
      setError('QR indirilemedi. Lütfen tekrar deneyin.');
      
      // Call onError if provided
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };
  
  // Show loading state with sand clock icon
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center glass-effect rounded-lg cyber-border relative" style={{ width: size, height: size }}>
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-lg cyber-border"
          />
          
          {/* Sand clock icon animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-3xl animate-pulse">⏳</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-purple-500/30 absolute top-0 left-0">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <div className={`flex flex-col items-center justify-center glass-effect rounded-lg cyber-border border-red-500/50`} style={{ width: size, height: size }}>
          <div className="text-4xl mb-2 text-red-400">⚠️</div>
          <p className="text-red-300 text-sm text-center px-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-900/30 text-red-300 rounded hover:bg-red-900"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size}
          className="rounded-lg cyber-border"
        />
        
        {/* Cyberpunk Border Glow */}
        <div className="absolute inset-0 rounded-lg border-2 border-purple-500/30 opacity-50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none glow-subtle"></div>
        
        {/* Success indicator */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
        
        {/* QR Info Badge */}
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="inline-block bg-purple-900/80 text-purple-200 text-xs px-2 py-1 rounded-full">
            HOYN! QR • {size}px
          </span>
        </div>
      </div>
      
      <button
        onClick={downloadQR}
        disabled={!isQRReady || !!error}
        className={`mt-4 px-4 py-2 rounded-lg transition-all transform shadow-lg ${
          isQRReady && !error 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:scale-105' 
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isQRReady && !error ? '📦 QR İndir' : '⏳ Hazırlanıyor...'}
      </button>
    </div>
  );
}