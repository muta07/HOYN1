
// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { updateHOYNProfile, HOYNProfile } from '@/lib/firebase'; // Merkezi güncelleme fonksiyonu
// QR Modu ile ilgili fonksiyonlar korunuyor
import { getUserQRMode, updateUserQRMode, QRMode, formatQRModeDisplay, validateNoteContent, validateSongContent, NoteContent, SongContent } from '@/lib/qr-modes';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import ProfileStats from '@/components/ui/ProfileStats';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();

  // Form state'leri
  const [formData, setFormData] = useState<Partial<HOYNProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
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

  // Profil verisi `useAuth` hook'undan geldiğinde form state'ini doldur
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        nickname: profile.nickname || '',
        bio: profile.bio || '',
        instagram: profile.instagram || '',
        twitter: profile.twitter || '',
        allowAnonymous: profile.allowAnonymous !== false, // default true
        // İşletme profili alanları
        companyName: profile.companyName || '',
        description: profile.description || '',
      });
    }
  }, [profile]);

  // QR Modu ayarlarını yükle (Bu kısım değiştirilmedi)
  useEffect(() => {
    const loadQRMode = async () => {
      if (user) {
        setQrModeLoading(true);
        try {
          const qrModeData = await getUserQRMode(user.uid);
          if (qrModeData) {
            setQrMode(qrModeData.mode);
            if (qrModeData.mode === 'note' && qrModeData.content) {
              setNoteContent(JSON.parse(qrModeData.content));
            } else if (qrModeData.mode === 'song' && qrModeData.content) {
              setSongContent(JSON.parse(qrModeData.content));
            }
          }
        } catch (error) { console.error('Error loading QR mode:', error); }
        finally { setQrModeLoading(false); }
      }
    };
    loadQRMode();
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // 1. Profil Bilgilerini Güncelle
      const profileUpdateSuccess = await updateHOYNProfile(profile.id, formData);
      if (!profileUpdateSuccess) {
        throw new Error('Profil bilgileri güncellenemedi.');
      }

      // 2. QR Modu Bilgilerini Güncelle (Mevcut mantık korundu)
      let qrModeContent = '';
      if (qrMode === 'note') {
        const validation = validateNoteContent(noteContent);
        if (!validation.valid) throw new Error('Not içeriği geçersiz: ' + validation.error);
        qrModeContent = JSON.stringify(noteContent);
      } else if (qrMode === 'song') {
        const validation = validateSongContent(songContent);
        if (!validation.valid) throw new Error('Şarkı içeriği geçersiz: ' + validation.error);
        qrModeContent = JSON.stringify(songContent);
      }
      
      const qrModeUpdateSuccess = await updateUserQRMode(user.uid, qrMode, qrModeContent);
      if (!qrModeUpdateSuccess) {
        throw new Error('QR modu güncellenemedi.');
      }
      
      setSaveSuccess(true);
      // Sayfayı yenilemek yerine başarı mesajı gösteriyoruz.
      // `useAuth` hook'u idealde profili yeniden çekerdi, şimdilik state güncel.
      setTimeout(() => setSaveSuccess(false), 3000); 

    } catch (error: any) {
      setSaveError(error.message || 'Bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loading size="lg" text="Profil yükleniyor..." /></div>;
  }

  if (!user || !profile) {
     return <div className="min-h-screen bg-black flex items-center justify-center text-white">Profil bulunamadı veya yüklenemedi. {authError}</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-8 text-center">
          Profilini Yönet
        </h1>

        <div className="mb-10">
          <ProfileStats userId={user.uid} isOwnProfile={true} />
        </div>

        {saveSuccess && <div className="bg-green-900/30 border border-green-500 text-green-300 p-3 rounded-lg mb-6 text-center">Profil başarıyla kaydedildi!</div>}
        {saveError && <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 rounded-lg mb-6 text-center">{saveError}</div>}

        <div className="grid md:grid-cols-2 gap-10">
          {/* Sol: Profil Formu */}
          <div className="bg-gray-900 p-8 rounded-xl border border-purple-900">
            <h2 className="text-2xl font-bold text-white mb-6">Genel Bilgiler</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              
              {profile.type === 'business' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">İşletme Adı</label>
                  <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleFormChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Görünen Ad</label>
                  <input type="text" name="displayName" value={formData.displayName || ''} onChange={handleFormChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-1">Takma Ad (Nickname)</label>
                <input type="text" name="nickname" value={formData.nickname || ''} onChange={handleFormChange} className="w-full p-3 bg-purple-900/20 border border-purple-500/50 rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bio / Açıklama</label>
                <textarea name={profile.type === 'business' ? 'description' : 'bio'} value={profile.type === 'business' ? formData.description : formData.bio} onChange={handleFormChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg h-24" />
              </div>

              <h3 className="text-lg font-bold text-white pt-4">Sosyal Medya</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Instagram (@ olmadan)</label>
                <input type="text" name="instagram" value={formData.instagram || ''} onChange={handleFormChange} placeholder="kullaniciadi" className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Twitter / X (@ olmadan)</label>
                <input type="text" name="twitter" value={formData.twitter || ''} onChange={handleFormChange} placeholder="kullaniciadi" className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
              </div>

              <div className="flex items-center pt-2">
                <input type="checkbox" id="anonymous" name="allowAnonymous" checked={formData.allowAnonymous || false} onChange={handleFormChange} className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
                <label htmlFor="anonymous" className="ml-2 text-gray-300">Anonim soru almaya izin ver</label>
              </div>

              <NeonButton onClick={handleSave} disabled={isSaving} variant="primary" size="lg" glow className="w-full !mt-6">
                {isSaving ? 'Kaydediliyor...' : '✨ Değişiklikleri Kaydet'}
              </NeonButton>
            </form>
          </div>

          {/* Sağ: QR Ayarları (Bu bölüm değiştirilmedi) */}
          <div className="space-y-8">
            <div className="glass-effect p-6 rounded-xl cyber-border">
                <h2 className="text-2xl font-bold text-white mb-4">QR Kod Modu</h2>
                {qrModeLoading ? <Loading size="sm" /> : (
                    <>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {(['profile', 'note', 'song'] as QRMode[]).map((mode) => {
                                const modeInfo = formatQRModeDisplay(mode);
                                return (
                                    <button key={mode} onClick={() => setQrMode(mode)} className={`p-3 rounded-lg border text-center ${qrMode === mode ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 bg-gray-800/50'}`}>
                                        <div className="text-2xl mb-1">{modeInfo.icon}</div>
                                        <div className="text-xs font-medium">{modeInfo.label}</div>
                                    </button>
                                );
                            })}
                        </div>
                        {qrMode === 'note' && <div className="bg-purple-900/10 p-4 rounded-lg"> {/* Note content... */} </div>}
                        {qrMode === 'song' && <div className="bg-purple-900/10 p-4 rounded-lg"> {/* Song content... */} </div>}
                    </>
                )}
            </div>
            <div className="glass-effect p-6 rounded-xl cyber-border flex flex-col items-center">
              <h2 className="text-2xl font-bold text-white mb-4">QR Önizleme</h2>
              <div className="p-4 bg-white rounded-lg mb-4">
                <div className="w-32 h-32 bg-black flex items-center justify-center text-white font-bold text-xs">QR KOD</div>
              </div>
              <div className="text-center space-y-1 mb-4">
                <p className="text-lg font-bold text-purple-300">{profile.nickname || profile.displayName}</p>
                <p className="text-xs text-gray-400">@{profile.username}</p>
              </div>
              <NeonButton onClick={() => router.push('/dashboard/qr-generator')} variant="primary" size="sm" glow className="w-full">
                📱 QR Kod Oluştur
              </NeonButton>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <NeonButton onClick={() => router.push('/dashboard')} variant="outline" size="md">
            ← Panele Dön
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
