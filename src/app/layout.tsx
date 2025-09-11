// src/app/layout.tsx
'use client';

import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/BottomNavigation';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider';
import '@/styles/globals.css';
import { useState, useEffect } from 'react';

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sadece client-side render
  if (!isClient) {
    return (
      <html lang="tr">
        <body className="bg-black text-white">
          <div style={{ visibility: 'hidden' }}>{children}</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="tr">
      <body className="bg-black text-white">
        <ThemeProvider>
          <SubscriptionProvider>
            <Navbar />
            <main className="min-h-screen pt-16 pb-20">{children}</main>
            <BottomNavigation />
          </SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}