// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName } from '@/lib/qr-utils';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';

export default function DashboardPage() {
  const { user, profile, accountType, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Dashboard useEffect triggered, user:', user, 'loading:', loading);
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to home');
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Dashboard yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  const username = getUserDisplayName(user, profile);
  const isBusinessAccount = accountType === 'business';

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black glow-text font-orbitron mb-4 float
                         bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {isBusinessAccount ? 'HOYN! Business' : 'Profil'}
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Hoş geldin, <span className="text-purple-400 font-bold glow-text">{username}</span>!
          </p>
          <p className="text-purple-300">
            {isBusinessAccount ? 'İşletmeni dijital dünyaya taşımaya hazır mısın? 🚀' : 'Kimliğini paylaşmaya hazır mısın? 🚀'}
          </p>
        </div>

        {/* Ana Eylem Butonları */}
        <div className="grid md:grid-cols-1 gap-8 mb-16">
          <div className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group cursor-pointer"
               onClick={() => router.push(isBusinessAccount ? '/dashboard/business-profile' : '/dashboard/profile')}>
            <div className="text-6xl mb-4 float">{isBusinessAccount ? '🏢' : '👤'}</div>
            <h2 className="text-3xl font-bold text-white mb-4 group-hover:glow-text transition-all">
              {isBusinessAccount ? 'İşletme Profilini Yönet' : 'Profilini Yönet'}
            </h2>
            <p className="text-gray-300 mb-6">
              {isBusinessAccount
                ? 'Şirket bilgileri, hizmetler, çalışma saatleri, sosyal medya hesapları – işletmeni özelleştir.'
                : 'Bio, sosyal medya, anonim soru ayarları – kim olduğunu özelleştir.'
              }
            </p>
            <NeonButton variant="secondary" size="md">
              ⚙️ {isBusinessAccount ? 'İşletme' : 'Profil'} Ayarları
            </NeonButton>
          </div>
        </div>

        {/* Özellik Grid'i */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="glass-effect p-6 rounded-lg cyber-border hover:glow-intense transition-all duration-300 group cursor-pointer text-center"
               onClick={() => router.push('/dashboard/messages')}>
            <div className="text-4xl mb-3 float">📬</div>
            <h3 className="font-bold text-white mb-2 group-hover:glow-text transition-all">
              Mesaj Kutusu
            </h3>
            <p className="text-gray-400 text-sm">Anonim mesajlarını oku</p>
          </div>
          
          <div className="glass-effect p-6 rounded-lg cyber-border hover:glow-intense transition-all duration-300 group cursor-pointer text-center"
               onClick={() => router.push('/designer')}>
            <div className="text-4xl mb-3 float">👕</div>
            <h3 className="font-bold text-white mb-2 group-hover:glow-text transition-all">
              Tişört Tasarımı
            </h3>
            <p className="text-gray-400 text-sm">QR'ini tişörtüne yerleştir</p>
          </div>
          
          <div className="glass-effect p-6 rounded-lg cyber-border hover:glow-intense transition-all duration-300 group cursor-pointer text-center"
               onClick={() => router.push('/scan')}>
            <div className="text-4xl mb-3 float">📱</div>
            <h3 className="font-bold text-white mb-2 group-hover:glow-text transition-all">
              QR Tarayıcı
            </h3>
            <p className="text-gray-400 text-sm">Başkalarının QR'larını tara</p>
          </div>
          
          <div className="glass-effect p-6 rounded-lg cyber-border hover:glow-intense transition-all duration-300 group cursor-pointer text-center"
               onClick={() => router.push('/dashboard/settings')}>
            <div className="text-4xl mb-3 float">⚙️</div>
            <h3 className="font-bold text-white mb-2 group-hover:glow-text transition-all">
              Ayarlar
            </h3>
            <p className="text-gray-400 text-sm">Hesap ve güvenlik ayarları</p>
          </div>
        </div>

        {/* Bilgi Mesajı */}
        <div className="glass-effect p-6 rounded-xl cyber-border mb-8 text-center">
          <p className="text-gray-300 mb-2">
            📱 QR kodunuzu oluşturmak ve paylaşmak için sağ alttaki profil butonunu kullanın
          </p>
          <p className="text-sm text-gray-500">
            QR kodunuzla tanışın, tişörtünüze basın, dünyaya gösterin!
          </p>
        </div>

        {/* Çıkış Butonu */}
        <div className="text-center">
          <NeonButton 
            onClick={() => {
              if (confirm('Çıkış yapmak istediğine emin misin?')) {
                handleLogout();
              }
            }}
            variant="outline"
            size="md"
            className="text-red-400 border-red-500 hover:bg-red-500/20"
          >
            🚪 Çıkış Yap
          </NeonButton>
        </div>
      </div>
    </div>
  );
}