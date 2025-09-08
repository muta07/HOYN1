'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getUserProfiles, createProfile, deleteProfile } from '@/lib/firebase';
import { Profile } from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import ProfileCard from '@/components/profile/ProfileCard';

export default function ProfileDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [newProfileType, setNewProfileType] = useState<'personal' | 'business' | 'car' | 'tshirt' | 'pet'>('personal');
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadProfiles();
  }, [user, router]);

  const loadProfiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userProfiles = await getUserProfiles(user.uid);
      setProfiles(userProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewProfile = async () => {
    if (!newProfileName.trim()) return;

    setCreatingProfile(true);
    try {
      // Generate slug from displayName
      const slug = newProfileName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
      
      const profileData = {
        slug,
        type: newProfileType,
        displayName: newProfileName,
        bio: '',
        isPublic: true,
        links: [],
        mood: {
          mode: 'profile' as const
        },
        socialLinks: [],
        showMode: 'fullProfile' as const,
        customMessage: '',
        customSong: ''
      };

      const newProfile = await createProfile(user!.uid, profileData);
      if (newProfile) {
        setProfiles([...profiles, newProfile]);
        setNewProfileName('');
        setNewProfileType('personal');
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('Profil oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteProfile(profileId);
      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Profil silinemedi. Lütfen tekrar deneyin.');
    }
  };

  if (authLoading) {
    return <Loading text="Yükleniyor..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Giriş yapılıyor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Profillerim
          </h1>
          <NeonButton onClick={() => setCreatingProfile(true)} variant="primary" glow>
            ➕ Yeni Profil Oluştur
          </NeonButton>
        </div>

        {loading ? (
          <Loading text="Profiller yükleniyor..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onDelete={handleDeleteProfile}
                onEdit={() => router.push(`/dashboard/profile/${profile.id}/edit`)}
                onView={() => router.push(`/p/${profile.slug}`)}
              />
            ))}
            
            {/* Add Profile Card */}
            <div className="group relative" onClick={() => setCreatingProfile(true)}>
              <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-700 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center hover:border-purple-500 transition-all duration-200 hover:bg-gray-800/50 cursor-pointer p-4">
                <div className="text-4xl mb-2">+</div>
                <p className="text-gray-400 group-hover:text-white text-center">Yeni Profil</p>
                <p className="text-xs text-gray-500 text-center mt-1">Profil ekle</p>
              </div>
              <div className="absolute inset-0 bg-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center justify-center">
                <span className="text-purple-400 text-lg">➕</span>
              </div>
            </div>
          </div>
        )}

        {/* Create Profile Modal */}
        {creatingProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">Yeni Profil Oluştur</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Profil Türü</label>
                <select
                  value={newProfileType}
                  onChange={(e) => setNewProfileType(e.target.value as any)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="personal">Kişisel</option>
                  <option value="business">İşletme</option>
                  <option value="car">Araba</option>
                  <option value="tshirt">Tişört</option>
                  <option value="pet">Evcil Hayvan</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Profil Adı</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Profil adı girin"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="flex gap-3">
                <NeonButton
                  onClick={createNewProfile}
                  disabled={!newProfileName.trim() || creatingProfile}
                  variant="primary"
                  className="flex-1"
                >
                  {creatingProfile ? 'Oluşturuluyor...' : 'Profil Oluştur'}
                </NeonButton>
                <NeonButton
                  onClick={() => setCreatingProfile(false)}
                  variant="outline"
                  className="flex-1"
                >
                  İptal
                </NeonButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
