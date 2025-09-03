// src/app/u/[username]/followers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFollowers, getFollowing, FollowRelation } from '@/lib/social';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import { ThemedCard, ThemedButton, ThemedText } from '@/components/ui/ThemedComponents';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';
import FollowButton from '@/components/social/FollowButton';

interface PageProps {
  params: {
    username: string;
  };
  searchParams: {
    tab?: 'followers' | 'following';
  };
}

export default function FollowersPage({ params, searchParams }: PageProps) {
  const { username } = params;
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetDisplayName, setTargetDisplayName] = useState<string>('');
  const [followers, setFollowers] = useState<FollowRelation[]>([]);
  const [following, setFollowing] = useState<FollowRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(searchParams.tab || 'followers');

  // Load target user info and followers/following
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Find target user by username
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          router.push('/discover');
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        setTargetUserId(userData.uid);
        setTargetDisplayName(userData.nickname || userData.displayName || userData.username);

        // Load followers and following
        const [followersData, followingData] = await Promise.all([
          getFollowers(userData.uid),
          getFollowing(userData.uid)
        ]);

        setFollowers(followersData);
        setFollowing(followingData);

      } catch (error) {
        console.error('Error loading followers/following:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Yükleniyor..." />
      </div>
    );
  }

  if (!targetUserId) {
    return null;
  }

  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <ThemedProfileWrapper>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <ThemedText size="3xl" weight="black" variant="primary" glow className="mb-2">
              {targetDisplayName}
            </ThemedText>
            <ThemedText variant="muted" className="mb-6">
              @{username}
            </ThemedText>

            {/* Tab Navigation */}
            <div className="flex justify-center gap-2 mb-8">
              <ThemedButton
                onClick={() => setActiveTab('followers')}
                variant={activeTab === 'followers' ? 'primary' : 'outline'}
                size="md"
              >
                👥 Takipçiler ({followers.length})
              </ThemedButton>
              <ThemedButton
                onClick={() => setActiveTab('following')}
                variant={activeTab === 'following' ? 'primary' : 'outline'}
                size="md"
              >
                ➡️ Takip Edilenler ({following.length})
              </ThemedButton>
            </div>
          </div>

          {/* Users List */}
          {currentList.length === 0 ? (
            <ThemedCard variant="default" className="text-center py-12">
              <div className="text-6xl mb-4">
                {activeTab === 'followers' ? '👥' : '➡️'}
              </div>
              <ThemedText size="xl" weight="bold" className="mb-2">
                {activeTab === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimse takip edilmiyor'}
              </ThemedText>
              <ThemedText variant="muted">
                {activeTab === 'followers' 
                  ? 'Bu kullanıcıyı henüz kimse takip etmiyor' 
                  : 'Bu kullanıcı henüz kimseyi takip etmiyor'}
              </ThemedText>
            </ThemedCard>
          ) : (
            <div className="space-y-4">
              {currentList.map((relation) => {
                const isFollowersList = activeTab === 'followers';
                const displayUsername = isFollowersList ? relation.followerUsername : relation.followingUsername;
                const userId = isFollowersList ? relation.followerId : relation.followingId;
                
                return (
                  <ThemedCard key={relation.id} variant="default" className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-xl">
                          👤
                        </div>
                        
                        {/* User Info */}
                        <div>
                          <ThemedText weight="bold" variant="primary" className="block">
                            @{displayUsername}
                          </ThemedText>
                          <ThemedText size="sm" variant="muted">
                            {new Date(relation.createdAt).toLocaleDateString('tr-TR')} tarihinden beri
                          </ThemedText>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <ThemedButton
                          onClick={() => router.push(`/u/${displayUsername}`)}
                          variant="outline"
                          size="sm"
                        >
                          👁️ Profil
                        </ThemedButton>
                        
                        <FollowButton
                          targetUserId={userId}
                          targetUsername={displayUsername}
                          variant="compact"
                        />
                      </div>
                    </div>
                  </ThemedCard>
                );
              })}
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <ThemedButton
              onClick={() => router.push(`/u/${username}`)}
              variant="outline"
              size="lg"
            >
              ← Profil Sayfasına Dön
            </ThemedButton>
          </div>
        </div>
      </div>
    </ThemedProfileWrapper>
  );
}