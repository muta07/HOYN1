// src/app/scan/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScannerWrapper from '@/components/qr/QRScannerWrapper';

export default function ScanPage() {
  const [data, setData] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleScan = (result: string) => {
    if (result) setData(result);
  };

  const handleError = (err: any) => {
    setError(err?.message || 'Kamera açılamadı.');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron text-center mb-6">
        QR Tara
      </h1>

      <div className="rounded-xl overflow-hidden border-4 border-purple-900 shadow-lg w-full max-w-xs">
        <QRScannerWrapper onScan={handleScan} onError={handleError} />
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-4 text-center bg-red-900/20 p-3 rounded-lg">
          {error}
        </p>
      )}

      {data && (
        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-300">Bulunan:</p>
          <p className="text-white font-mono break-all text-sm mt-1">{data}</p>
        </div>
      )}

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full text-gray-400 hover:text-white transition py-3 text-center border-t border-gray-800 mt-6"
      >
        ← Panele Dön
      </button>
    </div>
  );
}