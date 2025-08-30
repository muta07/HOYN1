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
  const [QRCode, setQRCode] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('qrcode.react')
      .then((mod) => {
        setQRCode(() => mod.default);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load QR Code:', error);
        setLoading(false);
      });
  }, []);

  if (loading || !QRCode) {
    return (
      <div 
        className={`flex items-center justify-center glass-effect rounded-lg cyber-border ${className}`}
        style={{ width: size, height: size }}
      >
        <Loading size="md" text="Generating QR..." />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="glass-effect p-4 rounded-lg cyber-border hover:glow-intense transition-all duration-300">
        <QRCode 
          value={value} 
          size={size - 32} // Account for padding
          bgColor={bgColor} 
          fgColor={fgColor} 
          level="H" 
          includeMargin
          imageSettings={logo ? {
            src: logo,
            height: 40,
            width: 40,
            excavate: true,
          } : undefined}
        />
      </div>
      
      {/* Floating effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
});

export default QRCodeWrapper;