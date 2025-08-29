// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('Kullanıcı');
  const [bio, setBio] = useState('Bu kişi hakkında hiçbir şey bilinmiyor.');
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
    // Burada verileri Firebase'e kaydet (ileride src/lib/api.ts ile yapılacak)
    alert('Profil bilgileri kaydedildi!');
    setLoading(false);
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
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

              <button
                onClick={handleSave}
                disabled={loading}
                type="button"
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-bold disabled:opacity-70"
              >
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </div>

          {/* Sağ: QR Önizleme */}
          <div className="bg-gray-900 p-8 rounded-xl border border-purple-900 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-6">QR Kodun</h2>
            <div className="p-6 bg-white rounded-xl mb-4">
              {/* Placeholder QR Code */}
              <div className="w-48 h-48 bg-black flex items-center justify-center text-white font-bold">
                QR KOD
              </div>
            </div>
            <p className="text-gray-300 text-center mb-4">
              Bu QR'ı taramak, {name || 'seni'} tanımanı sağlar.
            </p>
            <a
              href={`/ask/${user.email?.split('@')[0]}`}
              target="_blank"
              className="text-purple-400 hover:underline text-sm"
            >
              → Anonim mesaj gönder
            </a>
          </div>
        </div>

        {/* Geri Dön Butonu */}
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