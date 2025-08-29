// src/app/designer/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function DesignerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  // QR Ayarları
  const [qrSize, setQrSize] = useState(120);
  const [qrColor, setQrColor] = useState('#E040FB'); // Neon Mor
  const [bgColor, setBgColor] = useState('#000000');
  const [position, setPosition] = useState({ x: 50, y: 60 }); // % olarak
  const [isDragging, setIsDragging] = useState(false);

  // Kullanıcı girişi kontrolü
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  if (!user) return null;

  // Canvas'a tıklanıp sürüklendiğinde pozisyon güncellenir
  const handleMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleDownload = () => {
    // Gerçek projede: canvas veya div'i PNG'ye dönüştür
    alert('Tasarımınız indirildi! (Gerçek projede html2canvas ile PNG export)');
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 text-center">
          Tişört Tasarımcısı
        </h1>
        <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
          HOYN! QR kodunu tişörtüne yerleştir, dünyaya göster.
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Sol: Tasarım Alanı */}
          <div className="flex flex-col items-center">
            <div
              ref={canvasRef}
              className="relative w-80 h-96 bg-white rounded-none cursor-move border-4 border-dashed border-gray-600"
              onMouseMove={handleMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              style={{ backgroundColor: bgColor }}
            >
              {/* QR Kodu (sürüklenebilir) */}
              <div
                className="absolute cursor-move"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={() => setIsDragging(true)}
              >
                <div
                  className="w-6 h-6 bg-black flex items-center justify-center text-white text-xs font-bold rounded"
                  style={{ width: `${qrSize}px`, height: `${qrSize}px`, background: 'black' }}
                >
                  <span style={{ color: qrColor }}>HOYN!</span>
                </div>
              </div>

              {/* Mockup Gövdesi */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400 text-sm">
                  <p>HOYN!</p>
                  <p>QR kodunu sürükle</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-bold hover:shadow-lg transition"
            >
              Tasarımı İndir (PNG)
            </button>
          </div>

          {/* Sağ: Kontrol Paneli */}
          <div className="bg-gray-900 p-8 rounded-xl border border-purple-900">
            <h2 className="text-2xl font-bold text-white mb-6">Tasarımı Özelleştir</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tişört Rengi</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-10 rounded border border-gray-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">QR Boyutu</label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-400">{qrSize}px</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">QR Rengi</label>
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="w-full h-10 rounded border border-gray-700 cursor-pointer"
                />
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-400 hover:text-white transition"
                >
                  ← Panele Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}