// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserDisplayName, getUserUsername, updateUserNickname } from '@/lib/qr-utils';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  // Kullanıcı giriş yapmamışsa anasayfaya yönlendir
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Profil yüklenince formu doldur
  useEffect(() => {
    if (profile) {
      // Business profile check
      if ('companyName' in profile) {
        setDisplayName(profile.companyName || '');
        setNickname(profile.nickname || '');
        setBio(profile.description || '');
      } else {
        // Personal profile
        setDisplayName(profile.displayName || '');
        setNickname(profile.nickname || '');
        setBio(profile.bio || '');
      }
    } else if (user) {
      setDisplayName(user.displayName || '');
      setNickname('');
      setBio('');
    }
  }, [profile, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Profil yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Nickname'i güncelle - hem personal hem business için
      if (nickname.trim() !== profile?.nickname) {
        if (profile && 'companyName' in profile) {
          // Business profile
          await updateBusinessNickname(user.uid, nickname.trim() || displayName);
        } else {
          // Personal profile
          await updateUserNickname(user.uid, nickname.trim() || displayName);
        }
      }
      
      // Burada diğer verileri de Firebase'e kaydet (ileride src/lib/api.ts ile yapılacak)
      alert('Profil bilgileri kaydedildi!');
      
      // Profili yeniden yükle
      window.location.reload();
    } catch (error) {
      alert('Profil kaydedilemedi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-8 text-center">
          Profilini Yönet
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Sol: Profil Formu */}
          <div className="bg-gray-900 p-8 rounded-xl border border-purple-900">
            <h2 className="text-2xl font-bold text-white mb-6">Bilgilerin</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Gerçek Ad</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ad Soyad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-1">
                  <span className="font-bold">Takma Ad (Nickname)</span>
                  <span className="text-xs block text-gray-400 mt-1">
                    Bu ad her yerde görünür. Boş bırakırsan gerçek adın kullanılır.
                  </span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-3 bg-purple-900/20 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 transition-colors"
                  placeholder={displayName || 'Muta, Talha, vs...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Instagram (@)</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="kullaniciadi"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Twitter / X (@)</label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="kullaniciadi"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={allowAnonymous}
                  onChange={() => setAllowAnonymous(!allowAnonymous)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                />
                <label htmlFor="anonymous" className="ml-2 text-gray-300">
                  Anonim soru al
                </label>
              </div>

              <NeonButton
                onClick={handleSave}
                disabled={loading}
                variant="primary"
                size="lg"
                glow
                className="w-full"
              >
                {loading ? 'Kaydediliyor...' : '✨ Değişiklikleri Kaydet'}
              </NeonButton>
            </form>
          </div>

          {/* Sağ: QR Önizleme */}
          <div className="bg-gray-900 p-8 rounded-xl border border-purple-900 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-6">Profil Önizleme</h2>
            <div className="p-6 bg-white rounded-xl mb-4">
              {/* Placeholder QR Code */}
              <div className="w-48 h-48 bg-black flex items-center justify-center text-white font-bold">
                QR KOD
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-bold text-purple-300">
                {getUserDisplayName(user, profile)}
              </p>
              <p className="text-sm text-gray-400">
                @{getUserUsername(user)}
              </p>
              <p className="text-gray-300 text-sm mt-4">
                Bu QR'ı taramak, seni tanımanı sağlar.
              </p>
            </div>
            <a
              href={`/ask/${getUserUsername(user)}`}
              target="_blank"
              className="text-purple-400 hover:text-purple-300 text-sm hover:underline transition-colors"
            >
              → Anonim mesaj gönder
            </a>
          </div>
        </div>

        {/* Geri Dön Butonu */}
        <div className="text-center mt-8">
          <NeonButton
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="md"
          >
            ← Panele Dön
          </NeonButton>
        </div>
      </div>
    </div>
  );
}