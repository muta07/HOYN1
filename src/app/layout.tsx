// src/app/layout.tsx
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/BottomNavigation';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider';
import { MessagesProvider } from '@/components/providers/MessagesProvider';
import '@/styles/globals.css';
import FloatingProfileButton from '@/components/ui/FloatingProfileButton';

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-black text-white font-orbitron">
        <ThemeProvider>
          <SubscriptionProvider>
            <MessagesProvider>
              <Navbar />
              <main className="min-h-screen pt-16 pb-20">{children}</main>
              <BottomNavigation />
              <FloatingProfileButton />
            </MessagesProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}