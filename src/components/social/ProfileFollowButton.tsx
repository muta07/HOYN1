'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { followProfile, unfollowProfile, isProfileFollowing } from '@/lib/firebase';
import NeonButton from '@/components/ui/NeonButton';

interface ProfileFollowButtonProps {
  profileId: string;
  followerProfileId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export default function ProfileFollowButton({
  profileId,
  followerProfileId,
  onFollowChange,
  className = ''
}: ProfileFollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if already following on component mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !profileId || !followerProfileId || user.uid === profileId) {
        setCheckingStatus(false);
        return;
      }

      try {
        const following = await isProfileFollowing(user.uid, profileId);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [user, profileId, followerProfileId]);

  const handleFollow = async () => {
    if (!user || loading || !profileId || !followerProfileId || user.uid === profileId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const success = await unfollowProfile(user.uid, followerProfileId, profileId);
        if (success) {
          setIsFollowing(false);
          onFollowChange?.(false);
        }
      } else {
        // Follow
        const success = await followProfile(user.uid, followerProfileId, profileId);
        if (success) {
          setIsFollowing(true);
          onFollowChange?.(true);
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing profile:', error);
      alert('İşlem sırasında hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for current user or if not authenticated
  if (!user || !profileId || !followerProfileId || user.uid === profileId) {
    return null;
  }

  // Show loading state while checking
  if (checkingStatus) {
    return (
      <NeonButton
        disabled
        variant="outline"
        size="md"
        className={className}
      >
        Kontrol ediliyor...
      </NeonButton>
    );
  }

  return (
    <NeonButton
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? 'outline' : 'primary'}
      size="md"
      className={className}
      glow={!isFollowing}
    >
      {loading ? (
        'İşleniyor...'
      ) : isFollowing ? (
        '✓ Takip Ediliyor'
      ) : (
        '+ Takip Et'
      )}
    </NeonButton>
  );
}