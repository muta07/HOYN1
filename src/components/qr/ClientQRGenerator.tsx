// src/components/qr/ClientQRGenerator.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface ClientQRGeneratorProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
  className?: string;
  onReady?: () => void;
}

export default function ClientQRGenerator({ 
  value, 
  size = 256, 
  bgColor = '#ffffff', 
  fgColor = '#000000',
  includeMargin = true,
  className = '',
  onReady
}: ClientQRGeneratorProps) {
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure we're running on the client side
    setIsClient(true);
    
    // Set ready state after a short delay to ensure rendering is complete
    const timer = setTimeout(() => {
      setIsReady(true);
      onReady?.();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [onReady]);

  const handleDownload = () => {
    if (!isReady) {
      alert('QR kod henüz hazır değil. Lütfen bekleyin.');
      return;
    }

    try {
      // Get the canvas element by its ID
      const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
      if (!canvas) {
        alert('QR indirme hatası: Canvas bulunamadı');
        return;
      }
      
      // Convert to data URL and trigger download
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `hoyn-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('QR indirme hatası:', error);
      alert('QR indirme başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  if (!isClient) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="w-64 h-64 bg-gray-800 rounded-lg flex items-center justify-center">
          QR Kod Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative p-4 bg-white rounded-lg">
        {/* Using canvas render mode for better download support */}
        <QRCodeCanvas
          id="qr-code-canvas"
          value={value}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          includeMargin={includeMargin}
        />
      </div>
      
      {/* Download button - disabled until QR is ready */}
      <button
        onClick={handleDownload}
        disabled={!isReady}
        className={`mt-4 px-6 py-3 rounded-lg font-bold transition-all ${
          isReady 
            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/30' 
            : 'bg-gray-600 text-gray-300 cursor-not-allowed'
        }`}
      >
        {isReady ? '📱 QR Kodu İndir' : '⏳ Hazırlanıyor...'}
      </button>
      
      {/* Status indicator */}
      {isReady && (
        <div className="mt-2 text-sm text-green-400 flex items-center">
          <span className="mr-1">✓</span> QR Kod hazır
        </div>
      )}
    </div>
  );
}