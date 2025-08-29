// src/app/scan/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
const QrScanner = require('@yudiel/react-qr-scanner').default;

export default function ScanPage() {
  const [data, setData] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleScan = (result: string) => {
    if (result) {
      setData(result);
    }
  };

  const handleError = (err: any) => {
    setError(err?.message || 'Kamera açılamadı.');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron text-center mb-6">
        QR Tara
      </h1>
      <p className="text-gray-300 text-center mb-6">
        Kameranı aç, bir QR kodunu hedef al.
      </p>

      {/* QR Tarayıcı */}
      <div className="rounded-xl overflow-hidden border-4 border-purple-900 shadow-lg">
        <QrScanner
          onDecode={handleScan}
          onError={handleError}
          containerStyle={{ width: '100%', height: '100%' }}
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Hata Mesajı */}
      {error && (
        <p className="text-red-400 text-sm mt-4 text-center bg-red-900/20 p-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Sonuç */}
      {data && (
        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-300">Bulunan:</p>
          <p className="text-white font-mono break-all text-sm mt-1">{data}</p>
          {data.startsWith('http') && (
            <button
              onClick={() => window.open(data, '_blank')}
              className="text-purple-400 hover:underline text-sm mt-2 block"
            >
              → Bu linke git
            </button>
          )}
        </div>
      )}

      {/* Geri Dön Butonu */}
      <button
        onClick={() => router.push('/dashboard')}
        className="w-full text-gray-400 hover:text-white transition py-3 text-center border-t border-gray-800 mt-6"
      >
        ← Panele Dön
      </button>
    </div>
  );
}