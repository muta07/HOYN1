'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import ProfileMessageSender from '@/components/social/ProfileMessageSender';

export default function TestProfileMessagingPage() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState('');
  const [profileOwnerUid, setProfileOwnerUid] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Giriş Yapın</h2>
          <p className="text-gray-400 mb-6">Test için giriş yapmanız gerekiyor.</p>
          <NeonButton onClick={() => window.location.href = '/auth/login'} className="px-8">
            Giriş Yap
          </NeonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Profil Mesajlaşma Testi
        </h1>
        
        <div className="glass-effect p-6 rounded-xl cyber-border mb-8">
          <h2 className="text-xl font-bold mb-4 text-purple-300">Test Bilgileri</h2>
          <p className="text-gray-300 mb-4">
            Bu sayfa profil mesajlaşma sistemini test etmek için kullanılır. 
            Gerçek bir profil ID'si ve sahibinin kullanıcı ID'sini girerek test edebilirsiniz.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profil ID
              </label>
              <input
                type="text"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                placeholder="Profil ID'sini girin"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profil Sahibi UID
              </label>
              <input
                type="text"
                value={profileOwnerUid}
                onChange={(e) => setProfileOwnerUid(e.target.value)}
                placeholder="Profil sahibinin kullanıcı ID'sini girin"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
        
        {profileId && profileOwnerUid && (
          <div className="glass-effect p-6 rounded-xl cyber-border">
            <h2 className="text-xl font-bold mb-4 text-purple-300">Mesajlaşma Bileşeni</h2>
            <ProfileMessageSender 
              profileId={profileId}
              profileOwnerUid={profileOwnerUid}
            />
          </div>
        )}
      </div>
    </div>
  );
}