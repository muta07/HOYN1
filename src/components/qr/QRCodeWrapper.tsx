// src/components/qr/QRCodeWrapper.tsx
'use client';

import { useEffect, useState, memo, useRef, useCallback } from 'react';
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
  const [isQRReady, setIsQRReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  // Client-side mounting with proper cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    // Ensure client-side rendering
    if (typeof window !== 'undefined') {
      setIsClient(true);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Validate QR value with better error messages
  useEffect(() => {
    if (!value || value.trim() === '') {
      setError('QR değeri geçersiz - lütfen geçerli bir değer girin');
      setIsQRReady(false);
    } else if (value.length > 2000) {
      setError('QR değeri çok uzun - maksimum 2000 karakter');
      setIsQRReady(false);
    } else {
      setError(null);
    }
  }, [value]);

  // Handle QR ready state
  const handleQRReady = useCallback(() => {
    if (mountedRef.current) {
      setIsQRReady(true);
      onReady?.();
    }
  }, [onReady]);

  // Handle QR error state
  const handleQRError = useCallback((err: Error) => {
    if (mountedRef.current) {
      setError(`QR oluşturma hatası: ${err.message}`);
      setIsQRReady(false);
      onError?.(err);
    }
  }, [onError]);

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
        onReady={handleQRReady}
        onError={handleQRError}
      />
      
      {/* QR Ready Status Indicator */}
      {isQRReady && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
});

export default QRCodeWrapper;