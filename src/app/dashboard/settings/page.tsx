'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserSettings, 
  updateUserMessagingSettings 
} from '@/lib/firebase';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    canReceiveMessages: true,
    canReceiveAnonymous: true
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      router.push('/auth/login');
      return;
    }

    const loadSettings = async () => {
      try {
        setLoading(true);
        const userSettings = await getUserSettings(user.uid);
        if (userSettings) {
          setSettings(userSettings);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid, router]);

  const handleSaveSettings = async () => {
    if (!user?.uid) return;

    setSaving(true);
    setSaveStatus('idle');
    setSaveError(null);

    try {
      const success = await updateUserMessagingSettings(user.uid, settings);
      
      if (success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error('Settings could not be saved');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Ayarlar kaydedilemedi');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setSettings({
      canReceiveMessages: true,
      canReceiveAnonymous: true
    });
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Ayarlar yükleniyor..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Giriş Yapın</h2>
          <p className="text-gray-400 mb-6">Ayarları görüntülemek için giriş yapmanız gerekiyor.</p>
          <NeonButton onClick={() => router.push('/auth/login')} variant="primary">
            Giriş Yap
          </NeonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Ayarlar
          </h1>
          <p className="text-gray-400 mb-6">Mesajlaşma ve gizlilik ayarlarınızı yönetin</p>
        </div>

        {/* Messaging Settings */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Mesaj Ayarları
            </h2>

            <div className="space-y-6">
              {/* Receive Messages */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.canReceiveMessages}
                    onChange={(e) => setSettings({
                      ...settings,
                      canReceiveMessages: e.target.checked
                    })}
                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:border-purple-500 mr-3"
                  />
                  <div>
                    <p className="font-medium text-white">Mesaj Almayı Kabul Et</p>
                    <p className="text-sm text-gray-400">
                      Diğer kullanıcıların size normal mesaj göndermesine izin verin
                    </p>
                  </div>
                </label>
              </div>

              {/* Receive Anonymous Messages */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.canReceiveAnonymous}
                    onChange={(e) => setSettings({
                      ...settings,
                      canReceiveAnonymous: e.target.checked
                    })}
                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:border-purple-500 mr-3"
                  />
                  <div>
                    <p className="font-medium text-white">Anonim Mesaj Almayı Kabul Et</p>
                    <p className="text-sm text-gray-400">
                      Diğer kullanıcıların size anonim mesaj göndermesine izin verin. 
                      Anonim mesajlarda gönderen kimlik gizli kalır.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 mt-6">
              <NeonButton
                onClick={handleSaveSettings}
                disabled={saving}
                variant="primary"
                size="lg"
                className="flex-1"
                glow={!saving}
              >
                {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </NeonButton>
              <NeonButton
                onClick={() => router.push('/dashboard/settings/messaging')}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={saving}
              >
                Gelişmiş Ayarlar
              </NeonButton>
            </div>

            {/* Save Status */}
            {saveStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-center">Ayarlar başarıyla kaydedildi!</p>
              </div>
            )}

            {saveStatus === 'error' && saveError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-center">{saveError}</p>
              </div>
            )}
          </div>

          {/* Additional Privacy Settings */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              Gizlilik Ayarları
            </h2>

            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-white font-medium">Profil Görünürlüğü</p>
                <p className="text-gray-400">
                  Profilinizi herkese açık veya sadece takipçileriniz görebilir şekilde ayarlayabilirsiniz.
                </p>
                <NeonButton 
                  onClick={() => router.push('/dashboard/profile')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Profil Ayarlarını Düzenle
                </NeonButton>
              </div>

              <div className="space-y-2">
                <p className="text-white font-medium">QR Kod Ayarları</p>
                <p className="text-gray-400">
                  QR kodunuzun hangi bilgileri gösterdiğini özelleştirin (tam profil, mesaj modu, vb.).
                </p>
                <NeonButton 
                  onClick={() => router.push('/dashboard/qr-generator')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  QR Ayarlarını Düzenle
                </NeonButton>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700 mt-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Hesap Ayarları
            </h2>
            <div className="space-y-3">
              <NeonButton
                onClick={() => router.push('/dashboard/profile')}
                variant="outline"
                size="md"
                className="w-full"
              >
                Profil Düzenle
              </NeonButton>
              
              <NeonButton
                onClick={() => router.push('/dashboard/account')}
                variant="outline"
                size="md"
                className="w-full"
              >
                Hesap Bilgileri
              </NeonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
