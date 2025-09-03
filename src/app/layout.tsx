// src/app/layout.tsx
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/BottomNavigation';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider';
import '@/styles/globals.css';

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
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