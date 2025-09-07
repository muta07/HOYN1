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

  const handleDownload = (format: 'png' | 'svg' = 'png') => {
    if (!isReady) {
      alert('QR kod henüz hazır değil. Lütfen bekleyin.');
      return;
    }

    try {
      if (format === 'png') {
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
      } else if (format === 'svg') {
        // Get the SVG element
        const svgElement = document.querySelector('#qr-code-canvas + svg') as SVGSVGElement;
        if (!svgElement) {
          // Try to get the SVG directly
          const svg = document.querySelector('svg');
          if (!svg) {
            alert('QR indirme hatası: SVG bulunamadı');
            return;
          }
          
          // Serialize SVG to string
          const svgData = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `hoyn-qr-${Date.now()}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // Serialize SVG to string
          const svgData = new XMLSerializer().serializeToString(svgElement);
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
      }
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
      <div className="relative p-4 bg-white rounded">
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
      
      {/* Download buttons - disabled until QR is ready */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleDownload('png')}
          disabled={!isReady}
          className={`px-4 py-2 rounded transition-all ${
            isReady 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          📱 PNG İndir
        </button>
        
        <button
          onClick={() => handleDownload('svg')}
          disabled={!isReady}
          className={`px-4 py-2 rounded transition-all ${
            isReady 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          🖼️ SVG İndir
        </button>
      </div>
      
      {/* Status indicator */}
      {isReady && (
        <div className="mt-2 text-sm text-green-600 flex items-center">
          <span className="mr-1">✓</span> QR Kod hazır
        </div>
      )}
    </div>
  );
}
