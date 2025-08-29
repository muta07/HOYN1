// src/components/qr/QRCodeWrapper.tsx
'use client';

import { useEffect, useState } from 'react';

export default function QRCodeWrapper({ value, size, bgColor, fgColor }: { value: string; size: number; bgColor: string; fgColor: string }) {
  const [QRCode, setQRCode] = useState<any>(null);

  useEffect(() => {
    import('qrcode.react')
      .then((mod) => setQRCode(() => mod.default))
      .catch(console.error);
  }, []);

  if (!QRCode) {
    return <div className="w-48 h-48 bg-white flex items-center justify-center text-gray-500">Yükleniyor...</div>;
  }

  return <QRCode value={value} size={size} bgColor={bgColor} fgColor={fgColor} level="H" includeMargin />;
}