// src/app/dashboard/qr-scanner/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import QRScanner from '@/components/qr/QRScanner';
import Loading from '@/components/ui/Loading';

export default function QRScannerPage() {
  const { user, loading } = useAuth();
  const [scanResults, setScanResults] = useState<string[]>([]);

  const handleScanSuccess = (data: string) => {
    console.log('✅ QR Scanned in page:', data);
    setScanResults(prev => [data, ...prev.slice(0, 4)]); // Keep last 5 results
  };

  const handleScanError = (error: Error) => {
    console.error('❌ QR Scan error in page:', error);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="QR Scanner yükleniyor..." />
      </div>
    );
  }

  // Not authenticated - redirect handled by middleware
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 glow-text">
            📱 QR <span className="text-purple-400">Tarayıcı</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            HOYN! QR kodlarını ve diğer QR kodlarını hızlıca tarayın. 
            Kamera, flaş ve webview desteği ile her ortamda çalışır.
          </p>
        </div>

        {/* Scanner Component */}
        <QRScanner
          className="mb-8"
        />

        {/* Additional Info Section */}
        <div className="glass-effect p-6 rounded-xl cyber-border max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4 glow-text">🌟 Özellikler</h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
                <span>🎯</span>
                HOYN! QR Desteği
              </h3>
              <ul className="text-sm space-y-1">
                <li>• Profil QR kodları</li>
                <li>• Anonim mesaj QR kodları</li>
                <li>• Özel HOYN! QR kodları</li>
                <li>• Otomatik format tanıma</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
                <span>⚡</span>
                Gelişmiş Özellikler
              </h3>
              <ul className="text-sm space-y-1">
                <li>• Flaş ışığı desteği</li>
                <li>• Tarama geçmişi</li>
                <li>• WebView uyumluluğu</li>
                <li>• Hızlı kopyalama</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
                <span>📱</span>
                Platform Desteği
              </h3>
              <ul className="text-sm space-y-1">
                <li>• Chrome, Safari, Edge</li>
                <li>• WhatsApp WebView</li>
                <li>• Instagram Tarayıcı</li>
                <li>• Telegram WebView</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
                <span>🔒</span>
                Güvenlik & Gizlilik
              </h3>
              <ul className="text-sm space-y-1">
                <li>• Kamera erişimi güvenli</li>
                <li>• Veriler cihazda kalır</li>
                <li>• HTTPS şifreli bağlantı</li>
                <li>• İzin tabanlı erişim</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="glass-effect p-6 rounded-xl cyber-border max-w-4xl mx-auto mt-6">
          <h2 className="text-2xl font-bold text-white mb-4 glow-text">❓ Sorun Giderme</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-bold text-purple-300 mb-1">Kamera çalışmıyor?</h3>
              <p className="text-sm">
                Tarayıcı ayarlarından kamera iznini kontrol edin. HTTPS bağlantı gereklidir.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-purple-300 mb-1">QR kodu tanımıyor?</h3>
              <p className="text-sm">
                QR kodun temiz ve düzgün olduğundan emin olun. Mesafeyi ayarlayın ve flaşı deneyin.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-purple-300 mb-1">WhatsApp'ta çalışmıyor?</h3>
              <p className="text-sm">
                WhatsApp içinde "Tarayıcıda aç" seçeneğini kullanın veya doğrudan Chrome/Safari'de açın.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-purple-300 mb-1">Flaş açılmıyor?</h3>
              <p className="text-sm">
                Bazı cihazlarda flaş desteği bulunmaz. Ortamı aydınlatmayı deneyin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}