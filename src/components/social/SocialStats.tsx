// src/components/social/SocialStats.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocialStats, SocialStats as SocialStatsType } from '@/lib/social';
import { ThemedText, ThemedCard } from '@/components/ui/ThemedComponents';

interface SocialStatsProps {
  userId: string;
  username?: string;
  initialFollowersCount?: number;
  initialFollowingCount?: number;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
  clickable?: boolean;
}

export default function SocialStats({
  userId,
  username,
  initialFollowersCount = 0,
  initialFollowingCount = 0,
  variant = 'default',
  className = '',
  clickable = false
}: SocialStatsProps) {
  const router = useRouter();
  const [stats, setStats] = useState<SocialStatsType>({
    followersCount: initialFollowersCount,
    followingCount: initialFollowingCount
  });
  const [loading, setLoading] = useState(false);

  // Load social stats
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const socialStats = await getSocialStats(userId);
        setStats(socialStats);
      } catch (error) {
        console.error('Error loading social stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadStats();
    }
  }, [userId]);

  const handleStatsClick = (tab: 'followers' | 'following') => {
    if (clickable && username) {
      router.push(`/u/${username}/followers?tab=${tab}`);
    }
  };

  // Update stats when follow/unfollow happens
  const updateFollowersCount = (change: number) => {
    setStats(prev => ({
      ...prev,
      followersCount: Math.max(0, prev.followersCount + change)
    }));
  };

  // Expose update function to parent components
  useEffect(() => {
    // Store the update function on the component instance
    (updateFollowersCount as any).updateFollowersCount = updateFollowersCount;
  }, []);

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <button 
          className={`text-center ${clickable ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''}`}
          onClick={() => handleStatsClick('followers')}
          disabled={!clickable}
        >
          <ThemedText size="lg" weight="bold" variant="primary">
            {loading ? '...' : stats.followersCount}
          </ThemedText>
          <ThemedText size="sm" variant="muted" className="block">
            Takipçi
          </ThemedText>
        </button>
        <button 
          className={`text-center ${clickable ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''}`}
          onClick={() => handleStatsClick('following')}
          disabled={!clickable}
        >
          <ThemedText size="lg" weight="bold" variant="primary">
            {loading ? '...' : stats.followingCount}
          </ThemedText>
          <ThemedText size="sm" variant="muted" className="block">
            Takip
          </ThemedText>
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-sm">
          <ThemedText weight="bold" variant="primary">
            {loading ? '...' : stats.followersCount}
          </ThemedText>
          <ThemedText size="sm" variant="muted"> takipçi</ThemedText>
        </span>
        <span className="text-sm">
          <ThemedText weight="bold" variant="primary">
            {loading ? '...' : stats.followingCount}
          </ThemedText>
          <ThemedText size="sm" variant="muted"> takip</ThemedText>
        </span>
      </div>
    );
  }

  return (
    <ThemedCard variant="secondary" className={`${className}`}>
      <div className="flex items-center justify-around py-2">
        <div className="text-center">
          <ThemedText size="2xl" weight="bold" variant="primary" className="block">
            {loading ? '...' : stats.followersCount}
          </ThemedText>
          <ThemedText size="sm" variant="muted">
            Takipçi
          </ThemedText>
        </div>
        
        <div className="w-px h-8 bg-gray-600"></div>
        
        <div className="text-center">
          <ThemedText size="2xl" weight="bold" variant="primary" className="block">
            {loading ? '...' : stats.followingCount}
          </ThemedText>
          <ThemedText size="sm" variant="muted">
            Takip Edilen
          </ThemedText>
        </div>
      </div>
    </ThemedCard>
  );
}