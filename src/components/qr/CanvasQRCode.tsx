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
          className="rounded"
        />
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={downloadQR}
          disabled={!isQRReady || !!error}
          className={`px-4 py-2 rounded-lg transition-all ${
            isQRReady && !error 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          📱 PNG İndir
        </button>
        
        <button
          onClick={() => {
            if (canvasRef.current) {
              const svgData = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                  <rect width="${size}" height="${size}" fill="${bgColor}" />
                  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${size/10}" fill="${fgColor}">
                    QR Kod (SVG indirme desteklenmiyor)
                  </text>
                </svg>
              `;
              const blob = new Blob([svgData], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `hoyn-qr-${Date.now()}.svg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }}
          disabled={!isQRReady || !!error}
          className={`px-4 py-2 rounded-lg transition-all ${
            isQRReady && !error 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          🖼️ SVG İndir
        </button>
      </div>
    </div>
  );
}