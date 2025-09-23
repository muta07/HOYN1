// src/app/auth/setup-profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createHOYNProfile } from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';

export default function SetupProfilePage() {
  const { user, profile, loading: authLoading, needsProfileSetup, registerWithEmail, registerBusinessWithEmail } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    type: 'personal' as 'personal' | 'business',
    companyName: '',
    ownerName: '',
  });

  useEffect(() => {
    // Kullanıcı zaten profili varsa dashboard'a yönlendir
    if (!authLoading && user && !needsProfileSetup) {
      router.push('/dashboard');
    }
  }, [user, needsProfileSetup, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error('Kullanıcı oturumu açık değil');
      }

      let newProfile = null;

      if (formData.type === 'personal') {
        // Kişisel profil oluştur
        newProfile = await createHOYNProfile(
          user.uid,
          {
            email: user.email || '',
            nickname: formData.displayName || formData.username,
            username: formData.username,
            type: 'personal',
            displayName: formData.displayName || formData.username,
          },
          true // İlk profili birincil yap
        );
      } else {
        // İşletme profili oluştur
        newProfile = await createHOYNProfile(
          user.uid,
          {
            email: user.email || '',
            nickname: formData.companyName || formData.username,
            username: formData.username,
            type: 'business',
            companyName: formData.companyName,
            ownerName: formData.ownerName,
            businessType: 'Belirtilmedi',
          },
          true // İlk profili birincil yap
        );
      }

      if (newProfile) {
        console.log('Profil başarıyla oluşturuldu:', newProfile);
        // Dashboard'a yönlendir
        router.push('/dashboard');
      } else {
        throw new Error('Profil oluşturulamadı');
      }
    } catch (err: any) {
      console.error('Profil oluşturma hatası:', err);
      setError(err.message || 'Profil oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Yükleniyor..." />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black glow-text font-orbitron mb-4">
            Profil Oluştur
          </h1>
          <p className="text-gray-300">
            HOYN! deneyimine başlamak için profilini oluştur
          </p>
        </div>

        <div className="glass-effect p-8 rounded-xl cyber-border">
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="kullaniciadi"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Profil Türü</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    checked={formData.type === 'personal'}
                    onChange={() => setFormData({ ...formData, type: 'personal' })}
                    className="mr-2"
                  />
                  <span>Kişisel</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    checked={formData.type === 'business'}
                    onChange={() => setFormData({ ...formData, type: 'business' })}
                    className="mr-2"
                  />
                  <span>İşletme</span>
                </label>
              </div>
            </div>

            {formData.type === 'personal' ? (
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Görünen Ad</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Görünen adınız"
                  required
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Şirket Adı</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Şirket adınız"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Sahip Adı</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Sahip adı"
                    required
                  />
                </div>
              </>
            )}

            <NeonButton
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Oluşturuluyor...' : 'Profili Oluştur'}
            </NeonButton>
          </form>
        </div>
      </div>
    </div>
  );
}