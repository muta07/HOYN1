'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function BusinessRegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const { registerBusinessWithEmail, loading } = useAuth();
  const router = useRouter();

  const businessTypes = [
    'Restoran/Kafe',
    'Mağaza/Perakende',
    'Kuaför/Güzellik',
    'Spor Salonu',
    'Eğitim/Kurs',
    'Sağlık/Klinik',
    'Teknoloji',
    'Danışmanlık',
    'Diğer'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // İşletme hesabı oluştur
      await registerBusinessWithEmail(
        email, 
        password, 
        companyName,
        ownerName,
        nickname,
        businessType,
        address,
        phone,
        website,
        description
      );

      // Kayıt başarılı, dashboard'a yönlendir
      router.push('/dashboard');
    } catch (error: any) {
      alert('İşletme kaydı başarısız: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <AnimatedCard direction="scale" delay={0}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
              🏢 İşletme Hesabı
            </h1>
            <p className="text-gray-300 mb-2">İşletmeni dijital dünyaya taşı!</p>
            <p className="text-purple-300 text-sm">
              QR menüler, çalışan kartları, müşteri etkileşimi ve daha fazlası
            </p>
          </div>
        </AnimatedCard>

        <AnimatedCard direction="up" delay={200}>
          <form onSubmit={handleSubmit} className="glass-effect p-8 rounded-xl cyber-border space-y-6">
            {/* Şirket Bilgileri */}
            <div className="border-b border-purple-900/50 pb-6">
              <h2 className="text-xl font-bold text-purple-300 mb-4">📋 Şirket Bilgileri</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Şirket/İşletme Adı *
                  </label>
                  <input
                    type="text"
                    placeholder="ABC Restoran"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    İşletme Türü *
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Seçin</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  <span className="font-bold">Takma Ad (Business Name)</span>
                  <span className="text-xs block text-gray-400 mt-1">
                    Müşterilerin sizi bu isimle göreceği. Boş bırakırsan şirket adı kullanılır.
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="ABC, Restoran ABC, vs..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-3 bg-purple-900/20 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Yetkili Kişi */}
            <div className="border-b border-purple-900/50 pb-6">
              <h2 className="text-xl font-bold text-purple-300 mb-4">👤 Yetkili Kişi</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="info@abcrestoran.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Şifre *
                </label>
                <input
                  type="password"
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="border-b border-purple-900/50 pb-6">
              <h2 className="text-xl font-bold text-purple-300 mb-4">📞 İletişim Bilgileri</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    placeholder="+90 555 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adres
                  </label>
                  <input
                    type="text"
                    placeholder="Merkez Mah. Ana Cad. No:123 İstanbul"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.abcrestoran.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                İşletme Açıklaması
              </label>
              <textarea
                placeholder="İşletmeniz hakkında kısa bir açıklama..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors h-24"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <NeonButton
                type="submit"
                variant="primary"
                size="lg"
                glow
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                    İşletme Hesabı Oluşturuluyor...
                  </span>
                ) : (
                  '🚀 İşletme Hesabı Oluştur'
                )}
              </NeonButton>
            </div>

            {/* Geri Dön */}
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => router.push('/auth/register')}
                className="text-gray-400 hover:text-purple-300 text-sm transition-colors"
              >
                ← Hesap türü seçimine dön
              </button>
            </div>
          </form>
        </AnimatedCard>

        {/* İşletme Avantajları */}
        <AnimatedCard direction="up" delay={400}>
          <div className="mt-8 glass-effect p-6 rounded-xl cyber-border">
            <h3 className="text-xl font-bold text-white mb-4 text-center glow-text">
              🌟 İşletme Hesabı Avantajları
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-purple-400">📱</span>
                <span>QR menü ve katalog oluşturma</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">👥</span>
                <span>Çalışan kartları ve QR'ları</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">💬</span>
                <span>Müşteri geri bildirimleri</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">📊</span>
                <span>QR tarama istatistikleri</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">🎨</span>
                <span>Özel tasarım QR kodları</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">🔗</span>
                <span>Sosyal medya entegrasyonu</span>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}