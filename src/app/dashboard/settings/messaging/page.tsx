'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserSettings, updateUserMessagingSettings } from '@/lib/firebase';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';

export default function MessagingSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canReceiveMessages, setCanReceiveMessages] = useState(true);
  const [canReceiveAnonymous, setCanReceiveAnonymous] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const settings = await getUserSettings(user.uid);
        if (settings) {
          setCanReceiveMessages(settings.canReceiveMessages);
          setCanReceiveAnonymous(settings.canReceiveAnonymous);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid]);

  const handleSaveSettings = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateUserMessagingSettings(user.uid, {
        canReceiveMessages,
        canReceiveAnonymous
      });
      
      alert('Ayarlar başarıyla kaydedildi!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Ayarlar kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Ayarlar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
          Mesajlaşma Ayarları
        </h1>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Mesaj Alma Ayarları</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h3 className="font-medium text-white">Normal Mesajlar</h3>
                <p className="text-sm text-gray-400">
                  Diğer kullanıcıların size normal mesaj göndermesine izin verin
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={canReceiveMessages}
                  onChange={(e) => setCanReceiveMessages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h3 className="font-medium text-white">Anonim Mesajlar</h3>
                <p className="text-sm text-gray-400">
                  Diğer kullanıcıların size anonim mesaj göndermesine izin verin
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={canReceiveAnonymous}
                  onChange={(e) => setCanReceiveAnonymous(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <NeonButton
            onClick={handleSaveSettings}
            disabled={saving}
            variant="primary"
            className="flex-1"
          >
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </NeonButton>
          
          <NeonButton
            onClick={() => window.history.back()}
            variant="outline"
            className="flex-1"
          >
            Geri
          </NeonButton>
        </div>
      </div>
    </div>
  );
}