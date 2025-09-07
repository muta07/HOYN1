// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserDisplayName, getUserUsername, updateUserProfile, updateBusinessProfile } from '@/lib/qr-utils';
import { getUserQRMode, updateUserQRMode, QRMode, formatQRModeDisplay, validateNoteContent, validateSongContent, NoteContent, SongContent } from '@/lib/qr-modes';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import ProfileStats from '@/components/ui/ProfileStats';

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
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  
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

  // Load existing QR if generated
  useEffect(() => {
    if (user) {
      const checkQRStatus = async () => {
        try {
          const response = await fetch(`/api/generate-profile-qr?userId=${user.uid}`);
          const data = await response.json();
          if (data.qrGenerated) {
            setQrGenerated(true);
            setQrBase64(data.qrBase64);
            setQrMode(data.qrMode);
          }
        } catch (error) {
          console.error('Error checking QR status:', error);
        }
      };

      checkQRStatus();
    }
  }, [user]);

  const generateProfileQR = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/generate-profile-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrGenerated(true);
        setQrBase64(data.qrBase64);
        setQrMode(data.qrMode);
        alert('QR kodunuz başarıyla oluşturuldu! İndirerek kullanabilirsiniz.');
      } else {
        alert('QR oluşturma hatası: ' + data.error);
      }
    } catch (error) {
      console.error('QR generation error:', error);
      alert('QR oluşturma sırasında hata oluştu: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

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
      // Prepare updates
      const updates: any = {
        nickname: nickname.trim() || displayName,
        bio: bio.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        allowAnonymous,
      };
      
      // Add QR mode configuration
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
      
      updates.qrMode = qrMode;
      updates.qrModeContent = qrModeContent;
      
      // Update profile based on type
      if (profile && 'companyName' in profile) {
        // Business profile
        await updateBusinessProfile(user.uid, updates);
      } else {
        // Personal profile
        await updateUserProfile(user.uid, updates);
      }
      
      // Update QR mode
      const qrModeUpdated = await updateUserQRMode(user.uid, qrMode, qrModeContent);
      if (!qrModeUpdated) {
        alert('QR modu kaydedilemedi!');
        return;
      }
      
      alert('Profil bilgileri ve QR modu başarıyla kaydedildi!');
      
      // Reload page to refresh profile
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
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

          {/* Sağ: QR Ayarları ve Önizleme */}
          <div className="space-y-8">
            {/* QR Mode Configuration */}
            <div className="glass-effect p-6 rounded-xl cyber-border">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📱</span>
                QR Kod Modu
              </h2>
              <p className="text-gray-300 mb-4">
                QR kodun tarandığında ne gösterileceğini seç:
              </p>
              
              {qrModeLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loading size="sm" text="Yükleniyor..." />
                </div>
              ) : (
                <>
                  {/* QR Mode Selection */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(['profile', 'note', 'song'] as QRMode[]).map((mode) => {
                      const modeInfo = formatQRModeDisplay(mode);
                      return (
                        <button
                          key={mode}
                          onClick={() => setQrMode(mode)}
                          className={`p-3 rounded-lg border text-center ${
                            qrMode === mode
                              ? 'border-purple-500 bg-purple-900/20 glow-subtle'
                              : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-2xl mb-1">{modeInfo.icon}</div>
                          <div className="text-xs font-medium">{modeInfo.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mode-specific Configuration */}
                  {qrMode === 'note' && (
                    <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <span>📝</span>
                        Not Ayarları
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Başlık</label>
                          <input
                            type="text"
                            value={noteContent.title}
                            onChange={(e) => setNoteContent({...noteContent, title: e.target.value})}
                            placeholder="Başlık"
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            maxLength={50}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-purple-300 mb-1">
                            Not Metni <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            value={noteContent.text}
                            onChange={(e) => setNoteContent({...noteContent, text: e.target.value})}
                            placeholder="Mesajınız..."
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white h-20 text-sm"
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
                    <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <span>🎵</span>
                        Şarkı Ayarları
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-purple-300 mb-1">
                            Şarkı URL'si <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="url"
                            value={songContent.url}
                            onChange={(e) => setSongContent({...songContent, url: e.target.value})}
                            placeholder="Spotify/YouTube linki..."
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Şarkı</label>
                            <input
                              type="text"
                              value={songContent.title}
                              onChange={(e) => setSongContent({...songContent, title: e.target.value})}
                              placeholder="Şarkı adı"
                              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Sanatçı</label>
                            <input
                              type="text"
                              value={songContent.artist}
                              onChange={(e) => setSongContent({...songContent, artist: e.target.value})}
                              placeholder="Sanatçı"
                              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {qrMode === 'profile' && (
                    <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4">
                      <h3 className="font-bold text-green-300 mb-2 flex items-center gap-2">
                        <span>👤</span>
                        Profil Modu
                      </h3>
                      <p className="text-gray-300 text-xs">
                        QR kodun tarandığında normal profil sayfan açılacak.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* QR Önizleme ve Oluştur Butonu */}
            <div className="glass-effect p-6 rounded-xl cyber-border flex flex-col items-center">
              <h2 className="text-2xl font-bold text-white mb-4">QR Önizleme</h2>
              <div className="p-4 bg-white rounded-lg mb-4">
                {/* Placeholder QR Code */}
                <div className="w-32 h-32 bg-black flex items-center justify-center text-white font-bold text-xs">
                  QR KOD
                </div>
              </div>
              <div className="text-center space-y-1 mb-4">
                <p className="text-lg font-bold text-purple-300">
                  {getUserDisplayName(user, profile)}
                </p>
                <p className="text-xs text-gray-400">
                  @{getUserUsername(user)}
                </p>
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
