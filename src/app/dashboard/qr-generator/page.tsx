// src/app/dashboard/qr-generator/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import QRCodeWrapper from '@/components/qr/QRCodeWrapper';

export default function QRGeneratorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState('hoyn.app/u/kullanici');
  const [size, setSize] = useState(256);
  const [bgColor, setBgColor] = useState('#000000');
  const [fgColor, setFgColor] = useState('#E040FB');

  if (authLoading) return <div>Yükleniyor...</div>;
  if (!user) {
    router.push('/');
    return null;
  }

  // Kullanıcı email'inden kullanıcı adı al (null kontrolü var)
  const username = user.email ? user.email.split('@')[0] : 'kullanici';

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `hoyn-${username}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-8 text-center">
          QR Kodu Oluştur
        </h1>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col items-center">
            <div ref={qrRef} className="p-6 bg-white rounded-xl shadow-lg">
              <QRCodeWrapper value={value} size={size} bgColor={bgColor} fgColor={fgColor} />
            </div>
            <button
              onClick={handleDownload}
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-bold hover:shadow-lg transition"
            >
              QR'ı İndir (PNG)
            </button>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl border border-purple-900">
            <h2 className="text-2xl font-bold text-white mb-6">Özelleştir</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">İçerik</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Boyut</label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-400">{size}px</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Arka Plan</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-10 rounded border border-gray-700 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">QR Rengi</label>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full h-10 rounded border border-gray-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}