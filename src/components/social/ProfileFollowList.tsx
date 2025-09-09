'use client';

import { useState, useEffect } from 'react';
import { 
  onProfileFollowersSnapshot, 
  onProfileFollowingSnapshot,
  getProfileById
} from '@/lib/firebase';
import NeonButton from '@/components/ui/NeonButton';
import { Profile } from '@/lib/firebase';

interface ProfileFollowListProps {
  profileId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export default function ProfileFollowList({ profileId, type, onClose }: ProfileFollowListProps) {
  const [items, setItems] = useState<{id: string, profile?: Profile, followedAt: Date}[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!profileId) return;

    const loadFollowData = async () => {
      try {
        setLoading(true);
        
        if (type === 'followers') {
          // Load followers
          const unsub = onProfileFollowersSnapshot(profileId, async (followers) => {
            // Get profile data for each follower
            const followerProfiles = await Promise.all(
              followers.map(async (follower) => {
                try {
                  const profile = await getProfileById(follower.followerProfileId);
                  return {
                    id: follower.id,
                    profile: profile ? profile : undefined,
                    followedAt: follower.followedAt
                  };
                } catch (error) {
                  console.error('Error loading follower profile:', error);
                  return {
                    id: follower.id,
                    profile: undefined,
                    followedAt: follower.followedAt
                  };
                }
              })
            );
            setItems(followerProfiles.filter(item => item.profile !== null));
            setLoading(false);
          });
          
          // Handle unsubscribe properly
          if (typeof unsub === 'function') {
            setUnsubscribe(() => unsub);
          } else if (unsub && typeof (unsub as any).unsubscribe === 'function') {
            setUnsubscribe(() => () => (unsub as any).unsubscribe());
          }
        } else {
          // Load following
          const unsub = onProfileFollowingSnapshot(profileId, async (following) => {
            // Get profile data for each following
            const followingProfiles = await Promise.all(
              following.map(async (follow) => {
                try {
                  const profile = await getProfileById(follow.followingProfileId);
                  return {
                    id: follow.id,
                    profile: profile ? profile : undefined,
                    followedAt: follow.followedAt
                  };
                } catch (error) {
                  console.error('Error loading following profile:', error);
                  return {
                    id: follow.id,
                    profile: undefined,
                    followedAt: follow.followedAt
                  };
                }
              })
            );
            setItems(followingProfiles.filter(item => item.profile !== null));
            setLoading(false);
          });
          
          // Handle unsubscribe properly
          if (typeof unsub === 'function') {
            setUnsubscribe(() => unsub);
          } else if (unsub && typeof (unsub as any).unsubscribe === 'function') {
            setUnsubscribe(() => () => (unsub as any).unsubscribe());
          }
        }
      } catch (error) {
        console.error('Error loading follow data:', error);
        setLoading(false);
      }
    };

    loadFollowData();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    };
  }, [profileId, type, unsubscribe]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 md:items-center p-4">
      <div className="bg-gray-900 rounded-t-xl md:rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {type === 'followers' ? 'Takipçiler' : 'Takip Edilen'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <p>Yükleniyor...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>
              {type === 'followers' 
                ? 'Henüz takipçiniz yok' 
                : 'Henüz kimseyi takip etmiyorsunuz'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {item.profile?.imageUrl ? (
                    <img 
                      src={item.profile.imageUrl} 
                      alt={item.profile.displayName} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">
                      {item.profile?.type === 'business' ? '🏢' : 
                       item.profile?.type === 'car' ? '🚗' : 
                       item.profile?.type === 'tshirt' ? '👕' : 
                       item.profile?.type === 'pet' ? '🐶' : '👤'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {item.profile?.displayName || 'Bilinmeyen Kullanıcı'}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    @{item.profile?.slug || 'unknown'}
                  </p>
                </div>
                <NeonButton variant="outline" size="sm">
                  Profil
                </NeonButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}