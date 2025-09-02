'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import QRCodeWrapper from '@/components/qr/QRCodeWrapper';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { downloadQRCode, generateHOYNQR, getUserDisplayName, getUserUsername } from '@/lib/qr-utils';

export default function QRGeneratorPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);

  // QR Settings
  const [qrType, setQrType] = useState<'profile' | 'anonymous' | 'custom'>('profile');
  const [customValue, setCustomValue] = useState('');
  const [size, setSize] = useState(256);
  const [bgColor, setBgColor] = useState('#000000');
  const [fgColor, setFgColor] = useState('#E040FB');
  const [logoUrl, setLogoUrl] = useState(''); // Empty by default
  const [showLogo, setShowLogo] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Generate QR value based on type
  const displayName = getUserDisplayName(user, profile);
  const username = getUserUsername(user);
  
  const getQRValue = () => {
    switch (qrType) {
      case 'profile':
        return generateHOYNQR(username, 'profile');
      case 'anonymous':
        return generateHOYNQR(username, 'anonymous');
      case 'custom':
        // Custom değer girilmişse onu kullan, yoksa varsayılan profil URL'i
        if (customValue && customValue.trim()) {
          // HOYN! formatında JSON wrapper oluştur
          const hoynCustomData = {
            hoyn: true,
            type: 'custom',
            url: customValue.trim(),
            username: username,
            createdAt: new Date().toISOString()
          };
          return JSON.stringify(hoynCustomData);
        }
        return generateHOYNQR(username, 'profile');
      default:
        return generateHOYNQR(username, 'profile');
    }
  };

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
        setCustomLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Get current logo URL
  const getCurrentLogo = () => {
    if (!showLogo) return '';
    if (customLogo) return customLogo;
    // Default HOYN! logo
    return '/hoyn-logo.svg';
  };

  // Handle QR Generation
  const handleGenerateQR = async () => {
    setIsGenerating(true);
    
    try {
      // Validate custom URL if needed
      if (qrType === 'custom' && customValue.trim() === '') {
        alert('Lütfen özel URL\u0027nizi girin!');
        setIsGenerating(false);
        return;
      }
      
      // Debug: Log QR generation details
      console.log('🎯 QR Generation Started:', {
        qrType,
        username,
        customValue,
        displayName
      });
      
      const qrValue = getQRValue();
      console.log('📱 Generated QR Value:', qrValue);
      
      // Simulate generation process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setQrGenerated(true);
      
      // Success message
      const qrTypeText = qrType === 'profile' ? 'Profil' : qrType === 'anonymous' ? 'Anonim Mesaj' : 'Özel';
      console.log('✅ QR Generated Successfully!');
      alert(`✨ ${qrTypeText} QR kodu başarıyla oluşturuldu!`);
      
    } catch (error) {
      console.error('❌ QR Generation error:', error);
      alert('QR oluştururken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) return;
    
    try {
      setIsDownloading(true);
      await downloadQRCode('qr-code-container', `hoyn-${username}-${qrType}`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('İndirme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Reset QR when type changes
  useEffect(() => {
    setQrGenerated(false);
  }, [qrType, customValue, size, bgColor, fgColor, showLogo, customLogo]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="QR Generator yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  const qrValue = getQRValue();

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
            QR Kodu Oluştur ✨
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Kimliğini QR'a dönüştür, her yere yapıştır!
          </p>
          <p className="text-purple-300">
            Kullanıcı: <span className="font-bold text-white">{displayName}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* QR Preview Section */}
          <AnimatedCard className="flex flex-col items-center space-y-6">
            <div 
              id="qr-code-container" 
              ref={qrRef} 
              className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300"
            >
              {qrGenerated ? (
                <QRCodeWrapper 
                  value={qrValue} 
                  size={size} 
                  bgColor={bgColor} 
                  fgColor={fgColor}
                  logo={getCurrentLogo()}
                  className=""
                />
              ) : (
                <div 
                  className="flex flex-col items-center justify-center bg-gray-900 rounded-lg border-2 border-dashed border-purple-500/30"
                  style={{ width: size, height: size }}
                >
                  <div className="text-6xl mb-4 opacity-50">📱</div>
                  <p className="text-gray-400 text-center text-sm mb-2">QR Kodunuz Burada Gözükecek</p>
                  <p className="text-purple-300 text-xs text-center">Ayarları yapıp "QR Oluştur" butonuna bas</p>
                </div>
              )}
            </div>
            
            {/* Generate Button */}
            {!qrGenerated && (
              <NeonButton
                onClick={handleGenerateQR}
                variant="primary"
                size="lg"
                glow
                disabled={isGenerating}
                className="w-64"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                    QR Oluşturuluyor...
                  </span>
                ) : (
                  '🎆 QR Kodu Oluştur'
                )}
              </NeonButton>
            )}
            
            {/* Download Button - Only show when QR is generated */}
            {qrGenerated && (
              <NeonButton
                onClick={handleDownload}
                variant="primary"
                size="lg"
                glow
                disabled={isDownloading}
                className="w-64"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                    İndiriliyor...
                  </span>
                ) : (
                  '📱 QR\'i İndir (PNG)'
                )}
              </NeonButton>
            )}

            {/* Reset Button - Only show when QR is generated */}
            {qrGenerated && (
              <NeonButton
                onClick={() => setQrGenerated(false)}
                variant="outline"
                size="md"
                className="w-48"
              >
                🔄 Yeni QR Oluştur
              </NeonButton>
            )}

            {/* QR Info - Only show when generated */}
            {qrGenerated && (
              <div className="text-center space-y-2">
                <p className="text-sm text-purple-300">QR İçeriği:</p>
                <code className="text-xs bg-gray-900 px-3 py-1 rounded text-gray-300 break-all block max-w-xs">
                  {qrValue}
                </code>
              </div>
            )}
          </AnimatedCard>

          {/* Customization Panel */}
          <AnimatedCard className="glass-effect p-8 rounded-xl cyber-border">
            <h2 className="text-3xl font-bold text-white mb-8 glow-text">⚙️ Özelleştir</h2>
            
            <div className="space-y-8">
              {/* QR Type Selection */}
              <div>
                <label className="block text-lg font-bold text-purple-300 mb-4">QR Türü Seçin 🎯</label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setQrType('profile')}
                    className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                      qrType === 'profile'
                        ? 'border-purple-500 bg-purple-900/30 glow-subtle'
                        : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">Profil QR'ı 🎆</h3>
                        <p className="text-sm text-gray-400">HOYN! Profil - hoyn.app/u/{username}</p>
                        <p className="text-xs text-purple-300 mt-1">Profil sayfanı açar</p>
                      </div>
                      {qrType === 'profile' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setQrType('anonymous')}
                    className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                      qrType === 'anonymous'
                        ? 'border-purple-500 bg-purple-900/30 glow-subtle'
                        : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💬</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">Anonim Soru QR'ı 💬</h3>
                        <p className="text-sm text-gray-400">HOYN! Mesaj - hoyn.app/ask/{username}</p>
                        <p className="text-xs text-purple-300 mt-1">Sana anonim mesaj gönderir</p>
                      </div>
                      {qrType === 'anonymous' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setQrType('custom')}
                    className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                      qrType === 'custom'
                        ? 'border-purple-500 bg-purple-900/30 glow-subtle'
                        : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔗</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">Özel HOYN! QR 🔗</h3>
                        <p className="text-sm text-gray-400">HOYN! formatında özel link</p>
                        <p className="text-xs text-purple-300 mt-1">Kendi URL'ini HOYN! ile wrap'ler</p>
                      </div>
                      {qrType === 'custom' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom URL Input */}
              {qrType === 'custom' && (
                <div>
                  <label className="block text-lg font-bold text-purple-300 mb-3">
                    Özel URL 🔗
                    <span className="block text-sm text-gray-400 font-normal mt-1">
                      URL'in HOYN! formatında QR'a dönüştürülür. HOYN! tarayıcılar tarafından tanınacaktır.
                    </span>
                  </label>
                  <input
                    type="url"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="https://instagram.com/kullaniciadi"
                    className="w-full p-4 bg-gray-800/50 border border-purple-500/30 rounded-lg
                               focus:border-purple-400 focus:outline-none transition-colors
                               text-white placeholder-gray-400 font-mono"
                  />
                  <div className="mt-2 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <p className="text-xs text-purple-200 mb-1">
                      📝 QR İçeriği Önizlemesi:
                    </p>
                    <code className="text-xs text-gray-300 break-all">
                      {customValue ? `HOYN! Custom: ${customValue}` : 'URL girin...'}
                    </code>
                  </div>
                </div>
              )}

              {/* Logo Controls */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-bold text-purple-300">Logo Ayarları</label>
                  <button
                    onClick={() => setShowLogo(!showLogo)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      showLogo 
                        ? 'bg-purple-600 text-white glow-subtle' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {showLogo ? '✔ Logo Aktif' : 'Logo Ekle'}
                  </button>
                </div>
                
                {showLogo && (
                  <div className="space-y-4 p-4 border border-purple-500/30 rounded-lg bg-purple-900/10">
                    {/* Logo Type Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setCustomLogo('');
                          setLogoFile(null);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          !customLogo
                            ? 'border-purple-500 bg-purple-900/30 glow-subtle'
                            : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">🎆</div>
                        <div className="text-sm font-bold text-white">HOYN! Logo</div>
                      </button>
                      
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          customLogo
                            ? 'border-purple-500 bg-purple-900/30 glow-subtle'
                            : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">📁</div>
                        <div className="text-sm font-bold text-white">Kendi Logom</div>
                      </button>
                    </div>
                    
                    {/* Hidden File Input */}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    
                    {/* Custom Logo Preview */}
                    {customLogo && (
                      <div className="text-center">
                        <div className="inline-block p-2 bg-gray-800 rounded-lg border border-gray-600">
                          <img 
                            src={customLogo} 
                            alt="Custom logo preview" 
                            className="w-16 h-16 object-contain rounded"
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {logoFile?.name}
                        </p>
                        <button
                          onClick={() => {
                            setCustomLogo('');
                            setLogoFile(null);
                            if (logoInputRef.current) logoInputRef.current.value = '';
                          }}
                          className="text-red-400 hover:text-red-300 text-sm mt-1 transition-colors"
                        >
                          🗑 Kaldır
                        </button>
                      </div>
                    )}
                    
                    {/* Logo Tips */}
                    <div className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                      <p className="font-bold text-purple-300 mb-1">📝 Logo İpuçları:</p>
                      <ul className="space-y-1">
                        <li>• Maksimum 2MB boyut</li>
                        <li>• Kare format (1:1) en iyisi</li>
                        <li>• PNG formatı şeffaflık için ideal</li>
                        <li>• Basit tasarimlar daha net çıkar</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Size Control */}
              <div>
                <label className="block text-lg font-bold text-purple-300 mb-3">
                  Boyut: <span className="text-white">{size}px</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="600"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer
                           slider-thumb:appearance-none slider-thumb:h-6 slider-thumb:w-6 
                           slider-thumb:rounded-full slider-thumb:bg-purple-500 slider-thumb:cursor-pointer"
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
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer
                               bg-transparent appearance-none"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-purple-300 mb-3">QR Rengi</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer
                               bg-transparent appearance-none"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Colors */}
              <div>
                <label className="block text-lg font-bold text-purple-300 mb-3">Hazır Temalar</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => { setBgColor('#000000'); setFgColor('#E040FB'); }}
                    className="p-3 rounded-lg border border-gray-600 hover:border-purple-400 transition-colors"
                    style={{ background: 'linear-gradient(45deg, #000000 50%, #E040FB 50%)' }}
                  >
                    <span className="text-xs text-white font-bold">HOYN!</span>
                  </button>
                  <button
                    onClick={() => { setBgColor('#FFFFFF'); setFgColor('#000000'); }}
                    className="p-3 rounded-lg border border-gray-600 hover:border-purple-400 transition-colors"
                    style={{ background: 'linear-gradient(45deg, #FFFFFF 50%, #000000 50%)' }}
                  >
                    <span className="text-xs text-white font-bold">Klasik</span>
                  </button>
                  <button
                    onClick={() => { setBgColor('#1a1a1a'); setFgColor('#00ff88'); }}
                    className="p-3 rounded-lg border border-gray-600 hover:border-purple-400 transition-colors"
                    style={{ background: 'linear-gradient(45deg, #1a1a1a 50%, #00ff88 50%)' }}
                  >
                    <span className="text-xs text-white font-bold">Matrix</span>
                  </button>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Usage Tips */}
        <AnimatedCard className="mt-12 glass-effect p-8 rounded-xl cyber-border text-center">
          <h3 className="text-2xl font-bold text-white mb-4 glow-text">💡 Kullanım İpuçları</h3>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <span className="text-3xl mb-2 block">👕</span>
              <p className="font-bold text-white mb-1">Tişört Tasarımı</p>
              <p className="text-sm">600px boyutunda, siyah arka plan öneriyoruz</p>
            </div>
            <div>
              <span className="text-3xl mb-2 block">📱</span>
              <p className="font-bold text-white mb-1">Telefon Ekranı</p>
              <p className="text-sm">300-400px ideal, beyaz arka plan daha net</p>
            </div>
            <div>
              <span className="text-3xl mb-2 block">🖨️</span>
              <p className="font-bold text-white mb-1">Baskı İçin</p>
              <p className="text-sm">En az 300px, yüksek kontrast kullanın</p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}