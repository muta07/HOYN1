// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserDisplayName, getUserUsername, updateUserNickname, updateBusinessNickname } from '@/lib/qr-utils';
import { getUserQRMode, updateUserQRMode, QRMode, formatQRModeDisplay, validateNoteContent, validateSongContent, NoteContent, SongContent } from '@/lib/qr-modes';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import ProfileStats from '@/components/ui/ProfileStats';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { subscription, hasActiveSubscription, hasPremiumFeatures } = useSubscription();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // QR Mode states
  const [qrMode, setQrMode] = useState<QRMode>('profile');
  const [noteContent, setNoteContent] = useState<NoteContent>({ text: '', title: '', emoji: '📝' });
  const [songContent, setSongContent] = useState<SongContent>({ url: '', platform: 'spotify', title: '', artist: '' });
  const [qrModeLoading, setQrModeLoading] = useState(true);

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

  // Load user's QR mode configuration
  useEffect(() => {
    const loadQRMode = async () => {
      if (user) {
        setQrModeLoading(true);
        try {
          const qrModeData = await getUserQRMode(user.uid);
          if (qrModeData) {
            setQrMode(qrModeData.mode);
            
            // Parse content based on mode
            if (qrModeData.mode === 'note' && qrModeData.content) {
              try {
                const parsedNote = JSON.parse(qrModeData.content) as NoteContent;
                setNoteContent(parsedNote);
              } catch (error) {
                console.warn('Error parsing note content, using default');
                setNoteContent({ text: qrModeData.content, title: '', emoji: '📝' });
              }
            } else if (qrModeData.mode === 'song' && qrModeData.content) {
              try {
                const parsedSong = JSON.parse(qrModeData.content) as SongContent;
                setSongContent(parsedSong);
              } catch (error) {
                console.warn('Error parsing song content, using default');
                setSongContent({ url: qrModeData.content, platform: 'other', title: '', artist: '' });
              }
            }
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

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Save nickname if changed
      if (nickname.trim() !== profile?.nickname) {
        if (profile && 'companyName' in profile) {
          // Business profile
          await updateBusinessNickname(user.uid, nickname.trim() || displayName);
        } else {
          // Personal profile
          await updateUserNickname(user.uid, nickname.trim() || displayName);
        }
      }
      
      // Save QR mode configuration
      let qrModeContent = '';
      
      if (qrMode === 'note') {
        const validation = validateNoteContent(noteContent);
        if (!validation.valid) {
          alert('Not hatası: ' + validation.error);
          return;
        }
        qrModeContent = JSON.stringify(noteContent);
      } else if (qrMode === 'song') {
        const validation = validateSongContent(songContent);
        if (!validation.valid) {
          alert('Şarkı hatası: ' + validation.error);
          return;
        }
        qrModeContent = JSON.stringify(songContent);
      }
      
      const qrModeUpdated = await updateUserQRMode(user.uid, qrMode, qrModeContent);
      if (!qrModeUpdated) {
        alert('QR modu kaydedilemedi!');
        return;
      }
      
      alert('Profil bilgileri ve QR modu başarıyla kaydedildi!');
      
      // Reload page to refresh profile
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

        {/* Profile Statistics */}
        <div className="mb-10">
          <ProfileStats userId={user.uid} isOwnProfile={true} />
        </div>

        {/* Subscription Status */}
        <div className="mb-10">
          <div className="glass-effect p-8 rounded-xl cyber-border">
            <h2 className="text-2xl font-bold text-white mb-6 glow-text flex items-center gap-2">
              <span>💎</span>
              Üyelik Durumu
            </h2>
            
            {subscription ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg">
                      {subscription.planId === 'basic' && 'Basic Plan'}
                      {subscription.planId === 'pro' && 'Pro Plan'}
                      {subscription.planId === 'business' && 'Business Plan'}
                    </span>
                    {hasPremiumFeatures && (
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">Premium</span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">
                    {hasActiveSubscription 
                      ? `Bitiş tarihi: ${subscription.endDate.toLocaleDateString('tr-TR')}` 
                      : 'Üyeliğiniz sona ermiş'}
                  </p>
                </div>
                
                <NeonButton
                  onClick={() => router.push('/subscription')}
                  variant={hasActiveSubscription ? "outline" : "primary"}
                  size="md"
                >
                  {hasActiveSubscription ? 'Üyeliği Yönet' : 'Premium Ol'}
                </NeonButton>
              </div>
            ) : (
              <div className="text-center py-4">
                <Loading size="sm" text="Üyelik bilgileri yükleniyor..." />
              </div>
            )}
          </div>
        </div>

        {/* QR Mode Configuration */}
        <div className="mb-10">
          <div className="glass-effect p-8 rounded-xl cyber-border">
            <h2 className="text-2xl font-bold text-white mb-6 glow-text flex items-center gap-2">
              <span>📱</span>
              QR Kod Modu
            </h2>
            <p className="text-gray-300 mb-6">
              QR kodun tarandığında ne gösterileceğini seç:
            </p>
            
            {qrModeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="sm" text="QR modu yükleniyor..." />
              </div>
            ) : (
              <>
                {/* QR Mode Selection */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {(['profile', 'note', 'song'] as QRMode[]).map((mode) => {
                    const modeInfo = formatQRModeDisplay(mode);
                    return (
                      <button
                        key={mode}
                        onClick={() => setQrMode(mode)}
                        className={`p-4 rounded-lg border transition-all text-center ${
                          qrMode === mode
                            ? 'border-purple-500 bg-purple-900/20 glow-subtle'
                            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-3xl mb-2">{modeInfo.icon}</div>
                        <div className="font-bold text-white mb-1">{modeInfo.label}</div>
                        <div className="text-xs text-gray-400">{modeInfo.description}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Mode-specific Configuration */}
                {qrMode === 'note' && (
                  <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="font-bold text-purple-300 mb-4 flex items-center gap-2">
                      <span>📝</span>
                      Not Ayarları
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Not Başlığı (Opsiyonel)</label>
                        <input
                          type="text"
                          value={noteContent.title}
                          onChange={(e) => setNoteContent({...noteContent, title: e.target.value})}
                          placeholder="Örn: Hoş geldin mesajım"
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Emoji (Opsiyonel)</label>
                        <input
                          type="text"
                          value={noteContent.emoji}
                          onChange={(e) => setNoteContent({...noteContent, emoji: e.target.value})}
                          placeholder="📝"
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">
                          Not Metni <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={noteContent.text}
                          onChange={(e) => setNoteContent({...noteContent, text: e.target.value})}
                          placeholder="QR kod tarandığında gösterilecek mesajınız..."
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                          maxLength={500}
                          required
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {noteContent.text.length}/500 karakter
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {qrMode === 'song' && (
                  <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="font-bold text-purple-300 mb-4 flex items-center gap-2">
                      <span>🎵</span>
                      Şarkı Ayarları
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">
                          Şarkı URL'si <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="url"
                          value={songContent.url}
                          onChange={(e) => setSongContent({...songContent, url: e.target.value})}
                          placeholder="Spotify veya YouTube linki..."
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          required
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          Desteklenen platformlar: Spotify, YouTube
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Şarkı Adı (Opsiyonel)</label>
                          <input
                            type="text"
                            value={songContent.title}
                            onChange={(e) => setSongContent({...songContent, title: e.target.value})}
                            placeholder="Örn: Bohemian Rhapsody"
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Sanatçı (Opsiyonel)</label>
                          <input
                            type="text"
                            value={songContent.artist}
                            onChange={(e) => setSongContent({...songContent, artist: e.target.value})}
                            placeholder="Örn: Queen"
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {qrMode === 'profile' && (
                  <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-6">
                    <h3 className="font-bold text-green-300 mb-2 flex items-center gap-2">
                      <span>👤</span>
                      Profil Modu
                    </h3>
                    <p className="text-gray-300 text-sm">
                      QR kodun tarandığında normal profil sayfan açılacak. Ek ayar gerekmez.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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
            <NeonButton
              onClick={() => router.push('/dashboard/qr-generator')}
              variant="primary"
              size="md"
              glow
              className="mt-4"
            >
              📱 QR Kod Oluştur
            </NeonButton>
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