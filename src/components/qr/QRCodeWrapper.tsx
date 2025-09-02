// src/components/qr/QRCodeWrapper.tsx
'use client';

import { useEffect, useState, memo, useRef } from 'react';
import Loading from '@/components/ui/Loading';

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
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load QR component
  useEffect(() => {
    if (!isClient) return;
    
    const loadQR = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { default: QRCode } = await import('qrcode.react');
        setQRCodeComponent(() => QRCode);
        
        console.log('✅ QR Component loaded successfully');
        onReady?.();
      } catch (err) {
        const error = err as Error;
        console.error('❌ QR loading error:', error);
        setError('QR component yüklenemedi');
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQR();
  }, [isClient, onReady, onError]);

  // Validate QR value
  useEffect(() => {
    if (!value || value.trim() === '') {
      setError('QR değeri geçersiz');
    } else {
      setError(null);
    }
  }, [value]);

  // Show loading state
  if (!isClient || isLoading || !QRCodeComponent) {
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

  const qrValue = value || 'https://hoyn.app';
  const qrSize = size - 32; // Account for padding

  return (
    <div className={`relative group ${className}`} id="qr-code-display">
      <div className="glass-effect p-4 rounded-lg cyber-border hover:glow-intense transition-all duration-300">
        <QRCodeComponent
          value={qrValue}
          size={qrSize}
          bgColor={bgColor}
          fgColor={fgColor}
          level="H"
          includeMargin={true}
          imageSettings={logo ? {
            src: logo,
            height: Math.min(40, qrSize * 0.15),
            width: Math.min(40, qrSize * 0.15),
            excavate: true,
          } : undefined}
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
      
      {/* Success indicator */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <span className="text-white text-xs font-bold">✓</span>
      </div>
      
      {/* QR Info Badge */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className="inline-block bg-purple-900/80 text-purple-200 text-xs px-2 py-1 rounded-full">
          HOYN! QR • {qrSize}px
        </span>
      </div>
      
      {/* Floating effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Hidden canvas for download functionality */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={qrSize}
        height={qrSize}
      />
    </div>
  );
});

export default QRCodeWrapper;