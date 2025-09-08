'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getProfileFollowersCount, 
  getProfileFollowingCount,
  onProfileFollowersSnapshot,
  onProfileFollowingSnapshot
} from '@/lib/firebase';
import NeonButton from '@/components/ui/NeonButton';

interface ProfileStatsProps {
  profileId: string;
  initialFollowersCount?: number;
  initialFollowingCount?: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export default function ProfileStats({
  profileId,
  initialFollowersCount = 0,
  initialFollowingCount = 0,
  onFollowersClick,
  onFollowingClick
}: ProfileStatsProps) {
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount);
  const [loading, setLoading] = useState(true);

  // Load initial stats and set up real-time listeners
  useEffect(() => {
    if (!profileId) return;

    const loadInitialStats = async () => {
      try {
        const [followers, following] = await Promise.all([
          getProfileFollowersCount(profileId),
          getProfileFollowingCount(profileId)
        ]);
        
        setFollowersCount(followers);
        setFollowingCount(following);
        setLoading(false);
      } catch (error) {
        console.error('Error loading profile stats:', error);
        setLoading(false);
      }
    };

    loadInitialStats();

    // Set up real-time listeners
    const unsubscribeFollowers = onProfileFollowersSnapshot(profileId, (followers) => {
      setFollowersCount(followers.length);
    });

    const unsubscribeFollowing = onProfileFollowingSnapshot(profileId, (following) => {
      setFollowingCount(following.length);
    });

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [profileId]);

  return (
    <div className="flex items-center justify-center gap-6 mb-6">
      <button 
        onClick={onFollowersClick}
        className="text-center hover:opacity-80 transition-opacity cursor-pointer"
      >
        <div className="text-2xl font-bold text-white">
          {loading ? '...' : followersCount}
        </div>
        <div className="text-sm text-gray-400">
          Takipçi
        </div>
      </button>
      
      <div className="w-px h-8 bg-gray-600"></div>
      
      <button 
        onClick={onFollowingClick}
        className="text-center hover:opacity-80 transition-opacity cursor-pointer"
      >
        <div className="text-2xl font-bold text-white">
          {loading ? '...' : followingCount}
        </div>
        <div className="text-sm text-gray-400">
          Takip
        </div>
      </button>
    </div>
  );
}