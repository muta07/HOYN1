// src/components/qr/QRGenerator.tsx
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQR, QRType } from '@/hooks/useQR';
import QRCodeWrapper from './QRCodeWrapper';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface QRGeneratorProps {
  className?: string;
}

export default function QRGenerator({ className = '' }: QRGeneratorProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const qr = useQR(user, profile);
  const qrRef = useRef<HTMLDivElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo dosyası 2MB\'den küçük olmalıdır.');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Sadece resim dosyaları yüklenebilir.');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        qr.setCustomLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get current logo URL
  const getCurrentLogo = () => {
    if (!qr.qrState.settings.showLogo) return '';
    if (qr.qrState.settings.customLogo) return qr.qrState.settings.customLogo;
    // Default HOYN! logo
    return '/hoyn-logo.svg';
  };

  // Handle download
  const handleDownload = async (format: 'png' | 'jpeg' = 'png') => {
    if (!qrRef.current || !user) return;
    
    try {
      const username = user.email?.split('@')[0] || 'user';
      await qr.downloadQR('qr-code-container', `hoyn-${username}-${qr.qrState.type}`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('İndirme başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <Loading size="lg" text="QR Generator yükleniyor..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-400">QR oluşturmak için giriş yapmalısınız</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* QR Preview Section */}
        <AnimatedCard className="flex flex-col items-center space-y-6">
          <div 
            id="qr-code-container" 
            ref={qrRef} 
            className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300"
          >
            {qr.isReady ? (
              <QRCodeWrapper 
                value={qr.qrValue} 
                size={qr.qrState.settings.size} 
                bgColor={qr.qrState.settings.bgColor} 
                fgColor={qr.qrState.settings.fgColor}
                logo={getCurrentLogo()}
                className=""
                onError={() => qr.clearError()}
              />
            ) : (
              <div 
                className="flex flex-col items-center justify-center bg-gray-900 rounded-lg border-2 border-dashed border-purple-500/30"
                style={{ width: qr.qrState.settings.size, height: qr.qrState.settings.size }}
              >
                <div className="text-6xl mb-4 opacity-50">📱</div>
                <p className="text-gray-400 text-center text-sm mb-2">QR Kodunuz Burada Gözükecek</p>
                <p className="text-purple-300 text-xs text-center">Hazır olduğunda otomatik görünecek</p>
              </div>
            )}
          </div>
          
          {/* Download Buttons */}
          {qr.isReady && (
            <div className="flex flex-col space-y-3 w-full max-w-sm">
              <NeonButton
                onClick={() => handleDownload('png')}
                variant="primary"
                size="lg"
                glow
                disabled={qr.qrState.isDownloading}
                className="w-full"
              >
                {qr.qrState.isDownloading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                    İndiriliyor...
                  </span>
                ) : (
                  '📱 PNG Olarak İndir'
                )}
              </NeonButton>
              
              <NeonButton
                onClick={() => handleDownload('jpeg')}
                variant="outline"
                size="md"
                disabled={qr.qrState.isDownloading}
                className="w-full"
              >
                🖼️ JPEG Olarak İndir
              </NeonButton>
            </div>
          )}

          {/* QR Info */}
          {qr.isReady && (
            <div className="text-center space-y-2">
              <p className="text-sm text-purple-300">QR İçeriği:</p>
              <code className="text-xs bg-gray-900 px-3 py-1 rounded text-gray-300 break-all block max-w-xs">
                {qr.qrValue.length > 50 ? `${qr.qrValue.substring(0, 50)}...` : qr.qrValue}
              </code>
            </div>
          )}
        </AnimatedCard>

        {/* Customization Panel */}
        <AnimatedCard className="glass-effect p-8 rounded-xl cyber-border">
          <h2 className="text-3xl font-bold text-white mb-8 glow-text">⚙️ Özelleştir</h2>
          
          {/* Error Display */}
          {qr.qrState.error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 text-red-300 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span>{qr.qrState.error}</span>
                <button 
                  onClick={qr.clearError}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-8">
            {/* QR Type Selection */}
            <div>
              <label className="block text-lg font-bold text-purple-300 mb-4">QR Türü Seçin 🎯</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { type: 'profile' as QRType, icon: '👤', title: 'Profil QR\'ı 🎆', desc: 'Profil sayfanı açar' },
                  { type: 'anonymous' as QRType, icon: '💬', title: 'Anonim Soru QR\'ı 💬', desc: 'Sana anonim mesaj gönderir' },
                  { type: 'custom' as QRType, icon: '🔗', title: 'Özel HOYN! QR 🔗', desc: 'Kendi URL\'ini HOYN! ile wrap\'ler' }
                ].map(({ type, icon, title, desc }) => (
                  <button
                    key={type}
                    onClick={() => qr.setQRType(type)}
                    className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                      qr.qrState.type === type
                        ? 'border-purple-500 bg-purple-900/30 glow-subtle'
                        : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{title}</h3>
                        <p className="text-xs text-purple-300 mt-1">{desc}</p>
                      </div>
                      {qr.qrState.type === type && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            {qr.qrState.type === 'custom' && (
              <div>
                <label className="block text-lg font-bold text-purple-300 mb-3">
                  Özel URL 🔗
                </label>
                <input
                  type="url"
                  value={qr.qrState.customValue}
                  onChange={(e) => qr.setCustomValue(e.target.value)}
                  placeholder="https://instagram.com/kullaniciadi"
                  className="w-full p-4 bg-gray-800/50 border border-purple-500/30 rounded-lg
                             focus:border-purple-400 focus:outline-none transition-colors
                             text-white placeholder-gray-400 font-mono"
                />
              </div>
            )}

            {/* Size Control */}
            <div>
              <label className="block text-lg font-bold text-purple-300 mb-3">
                Boyut: <span className="text-white">{qr.qrState.settings.size}px</span>
              </label>
              <input
                type="range"
                min="200"
                max="600"
                step="50"
                value={qr.qrState.settings.size}
                onChange={(e) => qr.updateSettings({ size: Number(e.target.value) })}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>200px</span>
                <span>600px</span>
              </div>
            </div>

            {/* Color Controls */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold text-purple-300 mb-3">Arka Plan</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={qr.qrState.settings.bgColor}
                    onChange={(e) => qr.updateSettings({ bgColor: e.target.value })}
                    className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={qr.qrState.settings.bgColor}
                    onChange={(e) => qr.updateSettings({ bgColor: e.target.value })}
                    className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-purple-300 mb-3">QR Rengi</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={qr.qrState.settings.fgColor}
                    onChange={(e) => qr.updateSettings({ fgColor: e.target.value })}
                    className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={qr.qrState.settings.fgColor}
                    onChange={(e) => qr.updateSettings({ fgColor: e.target.value })}
                    className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Logo Controls */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-bold text-purple-300">Logo Ayarları</label>
                <button
                  onClick={() => qr.updateSettings({ showLogo: !qr.qrState.settings.showLogo })}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    qr.qrState.settings.showLogo 
                      ? 'bg-purple-600 text-white glow-subtle' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {qr.qrState.settings.showLogo ? '✔ Logo Aktif' : 'Logo Ekle'}
                </button>
              </div>
              
              {qr.qrState.settings.showLogo && (
                <div className="space-y-4 p-4 border border-purple-500/30 rounded-lg bg-purple-900/10">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full p-3 rounded-lg border-2 border-gray-600 bg-gray-800 hover:border-purple-400 transition-colors text-center"
                  >
                    <div className="text-2xl mb-1">📁</div>
                    <div className="text-sm font-bold text-white">
                      {logoFile ? logoFile.name : 'Logo Yükle'}
                    </div>
                  </button>
                  
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  
                  {qr.qrState.settings.customLogo && (
                    <div className="text-center">
                      <img 
                        src={qr.qrState.settings.customLogo} 
                        alt="Logo preview" 
                        className="w-16 h-16 object-contain rounded mx-auto mb-2"
                      />
                      <button
                        onClick={() => {
                          qr.setCustomLogo('');
                          setLogoFile(null);
                          if (logoInputRef.current) logoInputRef.current.value = '';
                        }}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        🗑 Kaldır
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preset Colors */}
            <div>
              <label className="block text-lg font-bold text-purple-300 mb-3">Hazır Temalar</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'HOYN!', bg: '#000000', fg: '#E040FB' },
                  { name: 'Klasik', bg: '#FFFFFF', fg: '#000000' },
                  { name: 'Matrix', bg: '#1a1a1a', fg: '#00ff88' }
                ].map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => qr.updateSettings({ bgColor: theme.bg, fgColor: theme.fg })}
                    className="p-3 rounded-lg border border-gray-600 hover:border-purple-400 transition-colors"
                    style={{ background: `linear-gradient(45deg, ${theme.bg} 50%, ${theme.fg} 50%)` }}
                  >
                    <span className="text-xs text-white font-bold drop-shadow-lg">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}