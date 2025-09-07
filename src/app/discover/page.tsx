// src/app/discover/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db, UserProfile, BusinessProfile } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { ThemedCard, ThemedButton, ThemedText, ThemedBadge } from '@/components/ui/ThemedComponents';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';
import FollowButton from '@/components/social/FollowButton';

interface DiscoverUser {
  uid: string;
  username: string;
  displayName: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
  isBusinessProfile: boolean;
  companyName?: string;
  businessType?: string;
  sector?: string;
  createdAt?: any;
  profileCustomization?: any;
}

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'personal' | 'business'>('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const businessTypes = [
    'Restoran/Kafe', 'Mağaza/Perakende', 'Kuaför/Güzellik', 'Spor Salonu',
    'Eğitim/Kurs', 'Sağlık/Klinik', 'Teknoloji', 'Danışmanlık', 'Diğer'
  ];

  // Load users
  const loadUsers = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const usersRef = collection(db, 'users');
      let userQuery = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      if (isLoadMore && lastDoc) {
        userQuery = query(
          usersRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(userQuery);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        return;
      }

      const newUsers: DiscoverUser[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Skip current user
        if (user && userData.uid === user.uid) return;
        
        const discoverUser: DiscoverUser = {
          uid: userData.uid,
          username: userData.username,
          displayName: userData.displayName,
          nickname: userData.nickname,
          bio: userData.bio,
          avatar: userData.avatar,
          isBusinessProfile: 'companyName' in userData,
          companyName: userData.companyName,
          businessType: userData.businessType,
          sector: userData.sector,
          createdAt: userData.createdAt,
          profileCustomization: userData.profileCustomization
        };
        
        newUsers.push(discoverUser);
      });

      if (isLoadMore) {
        setUsers(prev => [...prev, ...newUsers]);
      } else {
        setUsers(newUsers);
      }

      // Set last document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      if (querySnapshot.docs.length < 20) {
        setHasMore(false);
      }

    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(search) ||
        user.displayName.toLowerCase().includes(search) ||
        user.nickname?.toLowerCase().includes(search) ||
        user.bio?.toLowerCase().includes(search) ||
        (user.isBusinessProfile && user.companyName?.toLowerCase().includes(search))
      );
    }

    // Apply profile type filter
    if (selectedFilter === 'personal') {
      filtered = filtered.filter(user => !user.isBusinessProfile);
    } else if (selectedFilter === 'business') {
      filtered = filtered.filter(user => user.isBusinessProfile);
    }

    // Apply business type filter
    if (selectedBusinessType && selectedFilter === 'business') {
      filtered = filtered.filter(user => 
        user.isBusinessProfile && user.businessType === selectedBusinessType
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedFilter, selectedBusinessType]);

  // Load users on component mount
  useEffect(() => {
    if (!authLoading) {
      loadUsers();
    }
  }, [authLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Kullanıcılar yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ThemedProfileWrapper>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <ThemedText size="4xl" weight="black" variant="primary" glow className="mb-4">
              🔍 Kullanıcı Keşfi
            </ThemedText>
            <ThemedText size="xl" variant="default" className="mb-2">
              HOYN! topluluğundaki diğer kullanıcıları keşfedin
            </ThemedText>
            <ThemedText variant="muted">
              Kişisel profiller ve işletmeleri bulun, bağlantı kurun
            </ThemedText>
          </div>

          {/* Search and Filters */}
          <ThemedCard variant="default" className="mb-8">
            <div className="space-y-6">
              {/* Search Bar */}
              <div>
                <ThemedText weight="medium" className="mb-2 block">
                  🔍 Kullanıcı Ara
                </ThemedText>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Kullanıcı adı, isim veya açıklama ara..."
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Profile Type Filter */}
              <div>
                <ThemedText weight="medium" className="mb-3 block">
                  👤 Profil Türü
                </ThemedText>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Tümü', icon: '🌐' },
                    { key: 'personal', label: 'Kişisel', icon: '👤' },
                    { key: 'business', label: 'İşletme', icon: '🏢' }
                  ].map(filter => (
                    <ThemedButton
                      key={filter.key}
                      onClick={() => setSelectedFilter(filter.key as any)}
                      variant={selectedFilter === filter.key ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {filter.icon} {filter.label}
                    </ThemedButton>
                  ))}
                </div>
              </div>

              {/* Business Type Filter */}
              {selectedFilter === 'business' && (
                <div>
                  <ThemedText weight="medium" className="mb-3 block">
                    🏢 İşletme Türü
                  </ThemedText>
                  <div className="flex flex-wrap gap-2">
                    <ThemedButton
                      onClick={() => setSelectedBusinessType('')}
                      variant={selectedBusinessType === '' ? 'primary' : 'outline'}
                      size="sm"
                    >
                      Tümü
                    </ThemedButton>
                    {businessTypes.map(type => (
                      <ThemedButton
                        key={type}
                        onClick={() => setSelectedBusinessType(type)}
                        variant={selectedBusinessType === type ? 'primary' : 'outline'}
                        size="sm"
                      >
                        {type}
                      </ThemedButton>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="text-center">
                <ThemedText size="sm" variant="muted">
                  {filteredUsers.length} kullanıcı bulundu
                </ThemedText>
              </div>
            </div>
          </ThemedCard>

          {/* Users Grid */}
          {filteredUsers.length === 0 ? (
            <ThemedCard variant="default" className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <ThemedText size="xl" weight="bold" className="mb-2">
                Kullanıcı Bulunamadı
              </ThemedText>
              <ThemedText variant="muted">
                Arama kriterlerinizi değiştirmeyi deneyin
              </ThemedText>
            </ThemedCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredUsers.map((discoveredUser) => (
                <ThemedCard key={discoveredUser.uid} variant="default" className="hover:scale-105 transition-transform">
                  <div className="text-center">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-purple-900/30 flex items-center justify-center text-3xl mb-4 mx-auto">
                      {discoveredUser.isBusinessProfile ? '🏢' : '👤'}
                    </div>

                    {/* Name */}
                    <ThemedText size="lg" weight="bold" variant="primary" className="mb-1">
                      {discoveredUser.nickname || discoveredUser.displayName}
                    </ThemedText>

                    {/* Username */}
                    <ThemedText size="sm" variant="muted" className="mb-2">
                      @{discoveredUser.username}
                    </ThemedText>

                    {/* Business Info */}
                    {discoveredUser.isBusinessProfile && (
                      <div className="mb-3">
                        {discoveredUser.companyName && (
                          <ThemedText size="sm" variant="default" className="mb-1">
                            {discoveredUser.companyName}
                          </ThemedText>
                        )}
                        <div className="flex justify-center gap-1 flex-wrap">
                          {discoveredUser.businessType && (
                            <ThemedBadge variant="primary" size="sm">
                              {discoveredUser.businessType}
                            </ThemedBadge>
                          )}
                          {discoveredUser.sector && (
                            <ThemedBadge variant="accent" size="sm">
                              {discoveredUser.sector}
                            </ThemedBadge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {discoveredUser.bio && (
                      <ThemedText size="sm" variant="muted" className="mb-4 line-clamp-2">
                        {discoveredUser.bio}
                      </ThemedText>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <FollowButton
                        targetUserId={discoveredUser.uid}
                        targetUsername={discoveredUser.username}
                        targetDisplayName={discoveredUser.displayName}
                        variant="compact"
                        className="w-full"
                      />
                      
                      <ThemedButton
                        onClick={() => router.push(`/u/${discoveredUser.username}`)}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        👁️ Profili Görüntüle
                      </ThemedButton>
                      
                      <ThemedButton
                        onClick={() => router.push(`/ask/${discoveredUser.username}`)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        💬 Mesaj Gönder
                      </ThemedButton>
                    </div>
                  </div>
                </ThemedCard>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && filteredUsers.length > 0 && searchTerm.trim() === '' && (
            <div className="text-center">
              <ThemedButton
                onClick={() => loadUsers(true)}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? 'Yükleniyor...' : '📥 Daha Fazla Yükle'}
              </ThemedButton>
            </div>
          )}
        </div>
      </div>
    </ThemedProfileWrapper>
  );
}