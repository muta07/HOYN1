// src/app/layout.tsx
import Navbar from '@/components/Navbar';
import '@/styles/globals.css'; // ✅ Düzeltildi: '@/ ile doğru import

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-black text-white">
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  );
}