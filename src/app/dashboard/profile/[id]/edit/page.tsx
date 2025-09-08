'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getProfileById, updateProfile, deleteProfile } from '@/lib/firebase';
import { Profile } from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';

interface FormMood {
  mode: 'profile' | 'note' | 'song';
  text?: string;
  spotify?: {
    trackId: string;
    url: string;
    trackName?: string;
    artist?: string;
  };
}

interface FormData {
  displayName: string;
  bio: string;
  socialLinks: Array<{
    platform: string;
    url: string;
    label: string;
    icon?: string;
  }>;
  showMode: 'fullProfile' | 'message' | 'song';
  customMessage: string;
  customSong: string;
  mood: FormMood;
  isPublic: boolean;
}

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    bio: '',
    socialLinks: [],
    showMode: 'fullProfile',
    customMessage: '',
    customSong: '',
    mood: {
      mode: 'profile',
      text: '',
      spotify: undefined
    },
    isPublic: true
  });

  const profileId = params.id as string;

  useEffect(() => {
    if (!user || !profileId) {
      router.push('/dashboard/profile');
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const loadedProfile = await getProfileById(profileId);
        if (loadedProfile && loadedProfile.ownerUid === user.uid) {
          setProfile(loadedProfile);
          setFormData({
            displayName: loadedProfile.displayName || '',
            bio: loadedProfile.bio || '',
            socialLinks: loadedProfile.socialLinks || [],
            showMode: (loadedProfile.showMode as any) || 'fullProfile',
            customMessage: loadedProfile.customMessage || '',
            customSong: loadedProfile.customSong || '',
            mood: {
              mode: (loadedProfile.mood?.mode as any) || 'profile',
              text: loadedProfile.mood?.text || '',
              spotify: loadedProfile.mood?.spotify
            },
            isPublic: loadedProfile.isPublic !== undefined ? loadedProfile.isPublic : true
          });
        } else {
          router.push('/dashboard/profile');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        router.push('/dashboard/profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, profileId, router]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (index: number, field: string, value: string) => {
    const newSocialLinks = [...formData.socialLinks];
    if (field === 'platform' || field === 'label' || field === 'url') {
      newSocialLinks[index] = { ...newSocialLinks[index], [field]: value };
    }
    setFormData(prev => ({
      ...prev,
      socialLinks: newSocialLinks
    }));
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: '', label: '', url: '' }]
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const handleMoodModeChange = (newMode: 'profile' | 'note' | 'song') => {
    setFormData(prev => ({
      ...prev,
      mood: {
        mode: newMode,
        ...(newMode === 'note' ? { text: prev.mood.text } : { text: '' }),
        ...(newMode === 'song' ? { spotify: prev.mood.spotify } : { spotify: undefined })
      }
    }));
  };

  const handleMoodTextChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      mood: {
        ...prev.mood,
        text: value
      }
    }));
  };

  const handleMoodSpotifyChange = (field: 'trackId' | 'url' | 'trackName' | 'artist', value: string) => {
    setFormData(prev => ({
      ...prev,
      mood: {
        ...prev.mood,
        spotify: prev.mood.spotify ? {
          ...prev.mood.spotify,
          [field]: value
        } : {
          trackId: '',
          url: '',
          [field]: value
        }
      }
    }));
  };

  const handleShowModeChange = (mode: 'fullProfile' | 'message' | 'song') => {
    setFormData(prev => ({
      ...prev,
      showMode: mode,
      ...(mode === 'message' ? {} : { customMessage: '' }),
      ...(mode === 'song' ? {} : { customSong: '' })
    }));
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const updates: Partial<Profile> = {
        displayName: formData.displayName,
        bio: formData.bio,
        socialLinks: formData.socialLinks.filter(link => link.label.trim() && link.url.trim()),
        showMode: formData.showMode,
        ...(formData.showMode === 'message' ? { customMessage: formData.customMessage } : { customMessage: undefined }),
        ...(formData.showMode === 'song' ? { customSong: formData.customSong } : { customSong: undefined }),
        mood: formData.mood,
        isPublic: formData.isPublic
      };

      const success = await updateProfile(profile.id, updates as any);
      if (success) {
        setProfile({ ...profile, ...updates });
        alert('Profil başarıyla güncellendi!');
        router.push('/dashboard/profile');
      } else {
        alert('Profil güncellenemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Profil güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Bu profili silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      setSaving(true);
      const success = await deleteProfile(profileId);
      if (success) {
        alert('Profil başarıyla silindi!');
        router.push('/dashboard/profile');
      } else {
        alert('Profil silinemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Profil silinemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Profil yükleniyor..." />;
  }

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Yetkisiz erişim" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Profil Düzenle
          </h1>
          <NeonButton onClick={() => router.push('/dashboard/profile')} variant="outline">
            ← Geri
          </NeonButton>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
            <h2 className="text-lg font-bold text-white mb-4">Temel Bilgiler</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profil Adı</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Profil adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Açıklama (Bio)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                  placeholder="Profil açıklaması"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/160</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-300">
                  Profile herkese açık
                </label>
              </div>
            </div>
          </div>

          {/* QR Show Mode Settings */}
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
            <h2 className="text-lg font-bold text-white mb-4">QR Kod Tarama Ayarları</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleShowModeChange('fullProfile')}
                  className={`flex-1 p-3 rounded-lg border text-center ${
                    formData.showMode === 'fullProfile' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <span className="text-2xl mb-1">👤</span>
                  <div className="text-xs">Tam Profil Göster</div>
                </button>
                <button
                  onClick={() => handleShowModeChange('message')}
                  className={`flex-1 p-3 rounded-lg border text-center ${
                    formData.showMode === 'message' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <span className="text-2xl mb-1">💌</span>
                  <div className="text-xs">Özel Mesaj</div>
                </button>
                <button
                  onClick={() => handleShowModeChange('song')}
                  className={`flex-1 p-3 rounded-lg border text-center ${
                    formData.showMode === 'song' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <span className="text-2xl mb-1">🎵</span>
                  <div className="text-xs">Şarkı Çal</div>
                </button>
              </div>

              {formData.showMode === 'message' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Özel Mesaj</label>
                  <textarea
                    value={formData.customMessage}
                    onChange={(e) => handleInputChange('customMessage', e.target.value)}
                    placeholder="QR kod tarandığında gösterilecek mesaj (örn: 'Bugün müsait değilim', 'İyi hissetmiyorum', 'Sadece iyi enerjiler!')"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.customMessage.length}/200</p>
                </div>
              )}

              {formData.showMode === 'song' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Spotify Şarkı Linki</label>
                  <input
                    type="url"
                    value={formData.customSong}
                    onChange={(e) => handleInputChange('customSong', e.target.value)}
                    placeholder="Spotify şarkı veya çalma listesi linki"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                  <p className="text-xs text-gray-400">QR kod tarandığında bu şarkı otomatik olarak çalınacak</p>
                </div>
              )}

              <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-300">
                  <span className="font-bold">Nasıl Çalışır?</span>
                  <br />
                  {formData.showMode === 'fullProfile' && 'QR kod tarandığında tam profil sayfası açılır.'}
                  <br />
                  {formData.showMode === 'message' && 'QR kod tarandığında sadece özel mesaj gösterilir (Instagram hikayesi gibi).'}
                  <br />
                  {formData.showMode === 'song' && 'QR kod tarandığında direkt Spotify şarkısı açılır.'}
                </p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
            <h2 className="text-lg font-bold text-white mb-4">Sosyal Medya Linkleri</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="space-y-2">
                    <select
                      value={link.platform}
                      onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    >
                      <option value="">Platform Seç</option>
                      <option value="instagram">📸 Instagram</option>
                      <option value="tiktok">🎵 TikTok</option>
                      <option value="spotify">🎧 Spotify</option>
                      <option value="twitter">🐦 Twitter/X</option>
                      <option value="youtube">📺 YouTube</option>
                      <option value="linkedin">💼 LinkedIn</option>
                      <option value="facebook">🔵 Facebook</option>
                      <option value="custom">🔗 Diğer</option>
                    </select>
                    
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => handleSocialLinkChange(index, 'label', e.target.value)}
                      placeholder="Görünen isim (örn: Instagram, TikTok)"
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    />
                    
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                      placeholder="https://instagram.com/kullaniciadi"
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    />
                    
                    <NeonButton
                      onClick={() => removeSocialLink(index)}
                      variant="secondary"
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Sil
                    </NeonButton>
                  </div>
                ))}
              </div>

              <NeonButton onClick={addSocialLink} variant="outline" className="w-full">
                ➕ Yeni Sosyal Medya Ekle
              </NeonButton>

              {formData.socialLinks.length > 0 && (
                <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                  <p className="text-sm text-green-300">
                    <span className="font-bold">Önizleme:</span> Profil sayfasında bu linkler buton olarak görünecek
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mood Settings */}
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
            <h2 className="text-lg font-bold text-white mb-4">Ruh Hali Ayarları</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleMoodModeChange('profile')}
                  className={`flex-1 p-3 rounded-lg border text-center ${
                    formData.mood.mode === 'profile' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <span className="text-2xl mb-1">👤</span>
                  <div className="text-xs">Normal Profil</div>
                </button>
                <button
                  onClick={() => handleMoodModeChange('note')}
                  className={`flex-1 p-3 rounded-lg border text-center ${
                    formData.mood.mode === 'note' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <span className="text-2xl mb-1">📝</span>
                  <div className="text-xs">Özel Not</div>
                </button>
                <button
                  onClick={() => handleMoodModeChange('song')}
                  className={`flex-1 p-3 rounded-lg border text-center ${
                    formData.mood.mode === 'song' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <span className="text-2xl mb-1">🎵</span>
                  <div className="text-xs">Müzik Hissi</div>
                </button>
              </div>

              {formData.mood.mode === 'note' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Günlük Not</label>
                  <input
                    type="text"
                    value={formData.mood.text || ''}
                    onChange={(e) => handleMoodTextChange(e.target.value)}
                    placeholder="Bugün nasıl hissediyorsun? (örn: 'Enerjim yüksek!', 'Dinlenmeye ihtiyacım var')"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{(formData.mood.text || '').length}/100</p>
                </div>
              )}

              {formData.mood.mode === 'song' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mevcut Ruh Halim (Şarkı)</label>
                  <input
                    type="url"
                    value={formData.mood.spotify?.url || ''}
                    onChange={(e) => handleMoodSpotifyChange('url', e.target.value)}
                    placeholder="Spotify linki (şarkı veya çalma listesi)"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    value={formData.mood.spotify?.trackName || ''}
                    onChange={(e) => handleMoodSpotifyChange('trackName', e.target.value)}
                    placeholder="Şarkı adı (isteğe bağlı)"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    value={formData.mood.spotify?.artist || ''}
                    onChange={(e) => handleMoodSpotifyChange('artist', e.target.value)}
                    placeholder="Sanatçı (isteğe bağlı)"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              )}

              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300">
                  <span className="font-bold">Ruh Hali Profili:</span>
                  <br />
                  Profil ziyaretçileri bu ayarı görecek. Normal profil için "Normal Profil" seçin.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone - Delete Profile */}
          <div className="bg-red-900/20 p-6 rounded-xl border border-red-500/30">
            <h2 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
              <span>⚠️</span>
              Tehlikeli Alan - Profil Silme
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-red-200">
                Bu işlem profilinizi ve tüm verilerinizi kalıcı olarak silecektir. QR kodlarınız, mesajlarınız ve istatistikleriniz kaybolacaktır.
              </p>
              <NeonButton
                onClick={handleDeleteProfile}
                variant="secondary"
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={saving}
              >
                {saving ? 'Siliniyor...' : '🗑️ Profili Sil'}
              </NeonButton>
              <p className="text-xs text-red-400 text-center">
                <strong>UYARI:</strong> Bu işlem geri alınamaz. Emin olduğunuzda silin.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-8">
          <NeonButton onClick={handleSave} disabled={saving} className="w-full max-w-md">
            {saving ? 'Kaydediliyor...' : '💾 Profili Kaydet'}
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
