// src/app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kullanıcı girişi kontrolü
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    // Burada ayarlar Firebase'e kaydedilir (ileride src/lib/api.ts ile yapılacak)
    alert('Ayarlar başarıyla kaydedildi!');
    setLoading(false);
  };

  const handleSignOut = () => {
    if (confirm('Çıkış yapmak istediğine emin misin?')) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-8 text-center">
          Ayarlar
        </h1>
        <p className="text-gray-300 text-center mb-10">
          Hesap ve gizlilik ayarlarını yönet
        </p>

        <div className="space-y-8">
          {/* Hesap Bilgileri */}
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
            <h2 className="text-xl font-bold text-white mb-4">👤 Hesap</h2>
            <p className="text-gray-300 text-sm mb-2">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-gray-300 text-sm">
              <strong>Hesap Türü:</strong> Bireysel
            </p>
          </div>

          {/* Gizlilik Ayarları */}
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
            <h2 className="text-xl font-bold text-white mb-4">🔒 Gizlilik</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Profil Görünürlüğü</p>
                  <p className="text-gray-400 text-sm">Kimler seni görebilir?</p>
                </div>
                <select
                  value={publicProfile ? 'public' : 'private'}
                  onChange={(e) => setPublicProfile(e.target.value === 'public')}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white"
                >
                  <option value="public">Herkese Açık</option>
                  <option value="private">Sadece Takipçiler</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Anonim Soru Al</p>
                  <p className="text-gray-400 text-sm">Kimse kimliğini bilmeden sana mesaj gönderebilir</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowAnonymous}
                  onChange={() => setAllowAnonymous(!allowAnonymous)}
                  className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Bildirim Ayarları */}
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
            <h2 className="text-xl font-bold text-white mb-4">🔔 Bildirimler</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Uygulama Bildirimleri</p>
                  <p className="text-gray-400 text-sm">Mesaj geldiğinde bildirim göster</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                  className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Bildirimleri</p>
                  <p className="text-gray-400 text-sm">Yeni mesajlar için email gönder</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                  className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-70"
            >
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>

          {/* Çıkış Yap Butonu */}
          <div className="border-t border-gray-800 pt-6 text-center">
            <button
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 font-bold"
            >
              🔴 Çıkış Yap
            </button>
          </div>
        </div>

        {/* Geri Dön */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Panele Dön
          </button>
        </div>
      </div>
    </div>
  );
}