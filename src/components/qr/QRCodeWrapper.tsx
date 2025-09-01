// src/components/qr/QRCodeWrapper.tsx
'use client';

import { useEffect, useState, memo } from 'react';
import Loading from '@/components/ui/Loading';

interface QRCodeWrapperProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  logo?: string;
  className?: string;
}

const QRCodeWrapper = memo(function QRCodeWrapper({ 
  value, 
  size = 256, 
  bgColor = '#000000', 
  fgColor = '#E040FB',
  logo,
  className = ''
}: QRCodeWrapperProps) {
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load QR component
  useEffect(() => {
    if (!isClient) return;
    
    const loadQR = async () => {
      try {
        const { default: QRCode } = await import('qrcode.react');
        setQRCodeComponent(() => QRCode);
        console.log('✅ QR Component yüklendi!');
      } catch (error) {
        console.error('❌ QR yükleme hatası:', error);
      }
    };
    
    loadQR();
  }, [isClient]);

  // Show loading until client-side and component loaded
  if (!isClient || !QRCodeComponent) {
    return (
      <div 
        className={`flex items-center justify-center glass-effect rounded-lg cyber-border ${className}`}
        style={{ width: size, height: size }}
      >
        <Loading size="md" text="QR hazırlanıyor..." />
      </div>
    );
  }

  console.log('🎨 QR Render ediliyor:', { value, size, QRCodeComponent: !!QRCodeComponent });

  const qrValue = value || 'https://hoyn.app';

  return (
    <div className={`relative group ${className}`}>
      <div className="glass-effect p-4 rounded-lg cyber-border hover:glow-intense transition-all duration-300">
        <QRCodeComponent
          value={qrValue}
          size={size - 32}
          bgColor={bgColor}
          fgColor={fgColor}
          level="H"
          includeMargin={true}
          imageSettings={logo ? {
            src: logo,
            height: Math.min(40, (size - 32) * 0.2),
            width: Math.min(40, (size - 32) * 0.2),
            excavate: true,
          } : undefined}
        />
      </div>
      
      {/* Success indicator */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <span className="text-white text-xs font-bold">✓</span>
      </div>
      
      {/* Debug info */}
      <div className="absolute -bottom-8 left-0 text-xs text-green-400">
        QR: {qrValue.substring(0, 20)}...
      </div>
      
      {/* Floating effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
});

export default QRCodeWrapper;