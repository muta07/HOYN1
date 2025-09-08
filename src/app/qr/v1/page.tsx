// src/app/qr/v1/page.tsx
import { Suspense } from 'react';
import Loading from '@/components/ui/Loading';
import QRLandingPageClient from './QRLandingPageClient';

// This is a server component to handle the URL parameters
export default function QRLandingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const encodedData = searchParams?.d;

  if (!encodedData || typeof encodedData !== 'string') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Geçersiz QR Kodu.
      </div>
    );
  }

  let hoynData;
  try {
    const decodedData = Buffer.from(encodedData, 'base64url').toString('utf8');
    hoynData = JSON.parse(decodedData);
  } catch (error) {
    console.error("QR Data decoding failed:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        QR Kodu okunamadı.
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900"><Loading text="Yükleniyor..." /></div>}>
      <QRLandingPageClient hoynData={hoynData} />
    </Suspense>
  );
}