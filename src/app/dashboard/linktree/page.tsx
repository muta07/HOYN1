// src/app/dashboard/linktree/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserDisplayName, getUserUsername } from '@/lib/qr-utils';
import { getUserQRMode, QRMode, formatQRModeDisplay } from '@/lib/qr-modes';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import ProfileStats from '@/components/ui/ProfileStats';

// Helper function to safely get bio/description from profile
const getProfileBio = (profile: any) => {
  if (!profile) return 'HOYN! kullanıcısı';
  
  if ('bio' in profile) {
    return profile.bio || 'HOYN! kullanıcısı';
  }
  
  if ('description' in profile) {
    return profile.description || 'HOYN! işletme kullanıcısı';
  }
  
  return 'HOYN! kullanıcısı';
};

export default function LinktreeProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [qrMode, setQrMode] = useState<QRMode>('profile');
  const [qrModeLoading, setQrModeLoading] = useState(true);

  // Kullanıcı giriş yapmamışsa anasayfaya yönlendir
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load user's QR mode configuration
  useEffect(() => {
    const loadQRMode = async () => {
      if (user) {
        setQrModeLoading(true);
        try {
          const qrModeData = await getUserQRMode(user.uid);
          if (qrModeData) {
            setQrMode(qrModeData.mode);
          }
        } catch (error) {
          console.error('Error loading QR mode:', error);
        } finally {
          setQrModeLoading(false);
        }
      }
    };

    loadQRMode();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Profil yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  const username = getUserDisplayName(user, profile);
  const userHandle = getUserUsername(user);
  const profileBio = getProfileBio(profile);

  const modeInfo = formatQRModeDisplay(qrMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 to-pink-900/20 text-white py-12 px-6">
      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
            {username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold mb-1">{username}</h1>
          <p className="text-purple-300 mb-2">@{userHandle}</p>
          <p className="text-gray-400 text-sm">
            {profileBio}
          </p>
        </div>

        {/* Profile Statistics */}
        <div className="mb-8">
          <ProfileStats userId={user.uid} isOwnProfile={true} />
        </div>

        {/* QR Information */}
        <div className="glass-effect p-6 rounded-xl cyber-border mb-8">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span>📱</span>
            QR Kodun
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-black flex items-center justify-center text-white font-bold text-xs">
              QR
            </div>
            <div>
              <p className="font-medium">{modeInfo.label}</p>
              <p className="text-xs text-gray-400">{modeInfo.description}</p>
            </div>
          </div>
          <NeonButton
            onClick={() => router.push('/dashboard/qr-generator')}
            variant="primary"
            size="sm"
            glow
            className="w-full"
          >
            📱 QR Kod Oluştur
          </NeonButton>
        </div>

        {/* Linktree-style Menu */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="w-full glass-effect p-4 rounded-xl cyber-border hover:glow-intense transition-all duration-300 flex items-center gap-4"
          >
            <span className="text-2xl">👤</span>
            <div className="text-left">
              <p className="font-bold">Profilini Düzenle</p>
              <p className="text-xs text-gray-400">Bilgilerin ve ayarların</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/messages')}
            className="w-full glass-effect p-4 rounded-xl cyber-border hover:glow-intense transition-all duration-300 flex items-center gap-4"
          >
            <span className="text-2xl">📬</span>
            <div className="text-left">
              <p className="font-bold">Mesaj Kutusu</p>
              <p className="text-xs text-gray-400">Anonim mesajlarını oku</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/designer')}
            className="w-full glass-effect p-4 rounded-xl cyber-border hover:glow-intense transition-all duration-300 flex items-center gap-4"
          >
            <span className="text-2xl">👕</span>
            <div className="text-left">
              <p className="font-bold">Tişört Tasarımı</p>
              <p className="text-xs text-gray-400">QR'ini tişörtüne yerleştir</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/scan')}
            className="w-full glass-effect p-4 rounded-xl cyber-border hover:glow-intense transition-all duration-300 flex items-center gap-4"
          >
            <span className="text-2xl">🔍</span>
            <div className="text-left">
              <p className="font-bold">QR Tarayıcı</p>
              <p className="text-xs text-gray-400">Başkalarının QR'larını tara</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/settings')}
            className="w-full glass-effect p-4 rounded-xl cyber-border hover:glow-intense transition-all duration-300 flex items-center gap-4"
          >
            <span className="text-2xl">⚙️</span>
            <div className="text-left">
              <p className="font-bold">Ayarlar</p>
              <p className="text-xs text-gray-400">Hesap ve güvenlik ayarları</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>HOYN! - Dijital kimliğinizi paylaşın</p>
        </div>
      </div>
    </div>
  );
}