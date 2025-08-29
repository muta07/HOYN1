// src/components/qr/QRScannerWrapper.tsx
'use client';

import { useState, useEffect } from 'react';

export default function QRScannerWrapper({ onScan, onError }: { onScan: (result: string) => void; onError: (err: any) => void }) {
  const [Scanner, setScanner] = useState<any>(null);

  // Tarayıcıda yükle
  useEffect(() => {
    import('@yudiel/react-qr-scanner')
      .then((mod) => setScanner(() => mod.default))
      .catch(onError);
  }, [onError]);

  if (!Scanner) {
    return <div className="w-full h-64 bg-gray-900 flex items-center justify-center text-gray-400">Kamera başlatılıyor...</div>;
  }

  return <Scanner onDecode={onScan} onError={onError} containerStyle={{ width: '100%', height: '100%' }} videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}