// src/components/qr/QRCodeWrapper.tsx
'use client';

import { useEffect, useState, memo, useRef } from 'react';
import Loading from '@/components/ui/Loading';
import CanvasQRCode from './CanvasQRCode';

interface QRCodeWrapperProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  logo?: string;
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

const QRCodeWrapper = memo(function QRCodeWrapper({ 
  value, 
  size = 256, 
  bgColor = '#000000', 
  fgColor = '#E040FB',
  logo,
  className = '',
  onReady,
  onError
}: QRCodeWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side mounting
  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  // Validate QR value
  useEffect(() => {
    if (!value || value.trim() === '') {
      setError('QR değeri geçersiz');
    } else {
      setError(null);
    }
  }, [value]);

  // Show loading state
  if (!isClient || isLoading) {
    return (
      <div 
        className={`flex items-center justify-center glass-effect rounded-lg cyber-border ${className}`}
        style={{ width: size, height: size }}
      >
        <Loading size="md" text="QR hazırlanıyor..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center glass-effect rounded-lg cyber-border border-red-500/50 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-4xl mb-2 text-red-400">⚠️</div>
        <p className="text-red-300 text-sm text-center px-4">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <CanvasQRCode
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        logo={logo}
        onReady={onReady}
        onError={onError}
      />
    </div>
  );
});

export default QRCodeWrapper;