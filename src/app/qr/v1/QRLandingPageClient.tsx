// src/app/qr/v1/QRLandingPageClient.tsx
'use client';

import { useEffect } from 'react';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface QRLandingPageClientProps {
  hoynData: {
    u?: string; // username
    t?: string; // type
    s?: string; // slug
    // add other fields if necessary
  };
}

export default function QRLandingPageClient({ hoynData }: QRLandingPageClientProps) {
  const { u: username, t: type, s: slug } = hoynData;

  // Construct the deep link for the app
  const appLink = `hoyn://qr/scan?data=${encodeURIComponent(JSON.stringify(hoynData))}`;
  const storeLink = 'https://play.google.com/store/apps/details?id=com.hoyn'; // Example store link

  useEffect(() => {
    // Immediately try to redirect to the app. 
    // If the app is not installed, this will fail silently and the user will see the page content.
    window.location.href = appLink;
  }, [appLink]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <AnimatedCard className="glass-effect p-8 rounded-xl cyber-border text-center max-w-md w-full">
        <img src="/hoyn-logo.svg" alt="Hoyn Logo" className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2 glow-text">
          HOYN! QR Kodu
        </h1>
        {username && (
          <p className="text-lg text-gray-300 mb-6">
            <span className="font-bold text-purple-300">@{username}</span> kullanıcısına ait bir QR kod taradınız.
          </p>
        )}
        <p className="text-gray-400 mb-8">
          Devam etmek için lütfen HOYN! uygulamasını kullanın.
        </p>
        <div className="space-y-4">
          <NeonButton
            variant="primary"
            size="lg"
            glow
            onClick={() => (window.location.href = appLink)}
            className="w-full"
          >
            🚀 HOYN! Uygulamasında Aç
          </NeonButton>
          <NeonButton
            variant="outline"
            size="lg"
            onClick={() => {
              // If we have a slug, redirect to the web profile page
              if (slug) {
                window.location.href = `/p/${slug}`;
              } else if (username) {
                // Fallback to username-based URL
                window.location.href = `/u/${username}`;
              } else {
                // Fallback to store link
                window.location.href = storeLink;
              }
            }}
            className="w-full"
          >
            🌐 Web Tarayıcıda Aç
          </NeonButton>
          <NeonButton
            variant="outline"
            size="lg"
            onClick={() => (window.location.href = storeLink)}
            className="w-full"
          >
            📲 Uygulamayı İndir
          </NeonButton>
        </div>
        <p className="text-xs text-gray-500 mt-8">
          Uygulama otomatik açılmazsa, lütfen manuel olarak açın veya mağazadan indirin.
        </p>
      </AnimatedCard>
    </div>
  );
}