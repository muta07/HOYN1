// src/components/social/FollowButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { followUser, unfollowUser, isFollowing } from '@/lib/social';
import { ThemedButton } from '@/components/ui/ThemedComponents';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  targetDisplayName?: string;
  variant?: 'default' | 'compact';
  className?: string;
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void;
}

export default function FollowButton({
  targetUserId,
  targetUsername,
  targetDisplayName,
  variant = 'default',
  className = '',
  onFollowChange
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if already following on component mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || user.uid === targetUserId) {
        setCheckingStatus(false);
        return;
      }

      try {
        const following = await isFollowing(user.uid, targetUserId);
        setIsFollowingState(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleFollow = async () => {
    if (!user || loading || user.uid === targetUserId) return;

    setLoading(true);
    try {
      if (isFollowingState) {
        // Unfollow
        const success = await unfollowUser(user.uid, targetUserId);
        if (success) {
          setIsFollowingState(false);
          onFollowChange?.(false, -1); // Indicate decrease
        }
      } else {
        // Follow
        const success = await followUser(
          user.uid,
          user.displayName || user.email?.split('@')[0] || 'User',
          targetUserId,
          targetUsername
        );
        if (success) {
          setIsFollowingState(true);
          onFollowChange?.(true, 1); // Indicate increase
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      alert('İşlem sırasında hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for current user
  if (!user || user.uid === targetUserId) {
    return null;
  }

  // Show loading state while checking
  if (checkingStatus) {
    return (
      <ThemedButton
        disabled
        variant="outline"
        size={variant === 'compact' ? 'sm' : 'md'}
        className={className}
      >
        {variant === 'compact' ? '...' : 'Kontrol ediliyor...'}
      </ThemedButton>
    );
  }

  return (
    <ThemedButton
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowingState ? 'outline' : 'primary'}
      size={variant === 'compact' ? 'sm' : 'md'}
      className={className}
      glow={!isFollowingState}
    >
      {loading ? (
        variant === 'compact' ? '...' : 'İşleniyor...'
      ) : isFollowingState ? (
        variant === 'compact' ? '✓ Takip ediliyor' : '✓ Takip Ediliyor'
      ) : (
        variant === 'compact' ? '+ Takip Et' : '+ Takip Et'
      )}
    </ThemedButton>
  );
}