// src/app/feed/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActivityFeed, ActivityItem, getSuggestedUsers } from '@/lib/social';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import { ThemedCard, ThemedButton, ThemedText, ThemedBadge } from '@/components/ui/ThemedComponents';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';
import FollowButton from '@/components/social/FollowButton';

export default function ActivityFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load activity feed and suggestions
  const loadFeed = async (showRefreshing = false) => {
    if (!user) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [feedData, suggestionsData] = await Promise.all([
        getActivityFeed(user.uid, 30),
        getSuggestedUsers(user.uid, 5)
      ]);

      setActivities(feedData);
      setSuggestedUsers(suggestionsData);

    } catch (error) {
      console.error('Error loading activity feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadFeed();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Format activity description
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'profile_update': return '👤';
      case 'new_qr': return '📱';
      case 'joined': return '🎉';
      case 'business_update': return '🏢';
      default: return '📢';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'profile_update': return 'primary';
      case 'new_qr': return 'accent';
      case 'joined': return 'success';
      case 'business_update': return 'secondary';
      default: return 'primary';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Aktivite akışı yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ThemedProfileWrapper>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <ThemedText size="4xl" weight="black" variant="primary" glow className="mb-4">
              📡 Aktivite Akışı
            </ThemedText>
            <ThemedText size="xl" variant="default" className="mb-2">
              Takip ettiğin kullanıcıların son aktiviteleri
            </ThemedText>
            <div className="flex justify-center gap-2 mt-4">
              <ThemedButton
                onClick={() => loadFeed(true)}
                disabled={refreshing}
                variant="outline"
                size="md"
              >
                {refreshing ? '🔄 Yenileniyor...' : '🔄 Yenile'}
              </ThemedButton>
              <ThemedButton
                onClick={() => router.push('/discover')}
                variant="secondary"
                size="md"
              >
                🔍 Kullanıcı Keşfet
              </ThemedButton>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              <ThemedText size="lg" weight="bold" className="mb-4">
                📰 Son Aktiviteler
              </ThemedText>

              {activities.length === 0 ? (
                <ThemedCard variant="default" className="text-center py-12">
                  <div className="text-6xl mb-4">📡</div>
                  <ThemedText size="xl" weight="bold" className="mb-2">
                    Henüz aktivite yok
                  </ThemedText>
                  <ThemedText variant="muted" className="mb-6">
                    Takip ettiğin kullanıcıların aktiviteleri burada görünecek
                  </ThemedText>
                  <ThemedButton
                    onClick={() => router.push('/discover')}
                    variant="primary"
                    size="lg"
                    glow
                  >
                    🔍 Kullanıcı Keşfetmeye Başla
                  </ThemedButton>
                </ThemedCard>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ThemedCard key={activity.id} variant="default" className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Activity Icon */}
                        <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center text-lg flex-shrink-0">
                          {getActivityIcon(activity.action)}
                        </div>

                        {/* Activity Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <ThemedText weight="bold" variant="primary">
                              @{activity.username}
                            </ThemedText>
                            <ThemedBadge 
                              variant={getActivityColor(activity.action) as any} 
                              size="sm"
                            >
                              {activity.action === 'profile_update' && 'Profil'}
                              {activity.action === 'new_qr' && 'QR Kod'}
                              {activity.action === 'joined' && 'Katıldı'}
                              {activity.action === 'business_update' && 'İşletme'}
                            </ThemedBadge>
                          </div>

                          <ThemedText variant="default" className="mb-2">
                            {activity.description}
                          </ThemedText>

                          <div className="flex items-center justify-between">
                            <ThemedText size="sm" variant="muted">
                              {formatTimeAgo(activity.createdAt)}
                            </ThemedText>

                            {activity.metadata?.profileUrl && (
                              <ThemedButton
                                onClick={() => router.push(activity.metadata!.profileUrl!)}
                                variant="outline"
                                size="sm"
                              >
                                👁️ Görüntüle
                              </ThemedButton>
                            )}
                          </div>
                        </div>
                      </div>
                    </ThemedCard>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar - Suggested Users */}
            <div className="lg:col-span-1">
              <ThemedText size="lg" weight="bold" className="mb-4">
                💫 Önerilen Kullanıcılar
              </ThemedText>

              {suggestedUsers.length === 0 ? (
                <ThemedCard variant="secondary" className="text-center py-8">
                  <div className="text-4xl mb-3">🎯</div>
                  <ThemedText size="sm" variant="muted">
                    Şu anda öneri yok
                  </ThemedText>
                </ThemedCard>
              ) : (
                <div className="space-y-3">
                  {suggestedUsers.map((suggestedUser) => (
                    <ThemedCard key={suggestedUser.uid} variant="secondary" className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center text-lg flex-shrink-0">
                          {suggestedUser.isBusinessProfile ? '🏢' : '👤'}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <ThemedText size="sm" weight="bold" variant="primary" className="block truncate">
                            {suggestedUser.nickname || suggestedUser.displayName}
                          </ThemedText>
                          <ThemedText size="xs" variant="muted" className="truncate">
                            @{suggestedUser.username}
                          </ThemedText>
                          {suggestedUser.followersCount > 0 && (
                            <ThemedText size="xs" variant="muted">
                              {suggestedUser.followersCount} takipçi
                            </ThemedText>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <ThemedButton
                          onClick={() => router.push(`/u/${suggestedUser.username}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          👁️
                        </ThemedButton>
                        <div className="flex-1">
                          <FollowButton
                            targetUserId={suggestedUser.uid}
                            targetUsername={suggestedUser.username}
                            targetDisplayName={suggestedUser.displayName}
                            variant="compact"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </ThemedCard>
                  ))}

                  <ThemedButton
                    onClick={() => router.push('/discover')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    🔍 Daha Fazla Keşfet
                  </ThemedButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ThemedProfileWrapper>
  );
}