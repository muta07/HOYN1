'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getProfileBySlug, incrementProfileStats, incrementProfileLinkClicks } from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import ProfileStats from '@/components/social/ProfileStats';
import ProfileFollowButton from '@/components/social/ProfileFollowButton';
import SocialStats from '@/components/social/SocialStats';
import ProfileMessageSender from '@/components/social/ProfileMessageSender';
import ProfileFollowList from '@/components/social/ProfileFollowList';
import ProfileAnalytics from '@/components/social/ProfileAnalytics';

interface PageProps {
  params: {
    slug: string;
  };
}

// Create a wrapper function for handling link clicks
const handleLinkClick = async (profileId: string, url: string) => {
  // Increment link clicks
  try {
    await incrementProfileLinkClicks(profileId);
  } catch (error) {
    console.error('Failed to track link click:', error);
  }
  
  // Open the link
  window.open(url, '_blank');
};

export default function ProfilePage({ params }: PageProps) {
  const { slug } = params;
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for follower/following modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load profile by slug
        const profileData = await getProfileBySlug(slug);
        if (profileData) {
          setProfile(profileData);
          
          // Increment profile views (if viewing someone else's profile)
          if (currentUser && currentUser.uid !== profileData.ownerUid) {
            incrementProfileStats(profileData.id, 'views').catch(error => {
              console.error('Failed to track profile view:', error);
            });
          }
        } else {
          setError('Profil bulunamadı');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Profil yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [slug, currentUser]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Profil yükleniyor..." />
      </div>
    );
  }

  // Show error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <AnimatedCard className="text-center max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            {error || 'Profil Bulunamadı'}
          </h1>
          <p className="text-gray-400 mb-6">
            Bu kullanıcıya ait bir profil bulunmuyor.
          </p>
          <NeonButton
            onClick={() => router.push('/')}
            variant="primary"
            size="lg"
            glow
          >
            Ana Sayfaya Dön
          </NeonButton>
        </AnimatedCard>
      </div>
    );
  }

  // Determine if this is the profile owner
  const isOwner = currentUser && currentUser.uid === profile.ownerUid;
  
  // Get display name
  const displayName = profile.displayName || profile.companyName || profile.username;
  
  // Check if this is a business profile
  const isBusinessProfile = profile.type === 'business';
  
  // Get bio/description
  const bio = profile.bio || profile.description || '';

  // Handle mood mode (custom message or song)
  if (profile.showMode === 'message' && profile.customMessage) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatedCard direction="up" className="text-center">
            <div className="mb-8">
              <div className="text-8xl mb-4">📝</div>
              
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4">
                Özel Mesaj
              </h1>
              
              <div className="glass-effect p-8 rounded-xl cyber-border mb-6">
                <p className="text-xl leading-relaxed text-gray-100 whitespace-pre-wrap">
                  {profile.customMessage}
                </p>
              </div>
              
              <div className="text-sm text-gray-400 mb-6">
                <p>Bu mesaj <span className="text-purple-400 font-bold">@{profile.username}</span> tarafından gönderildi</p>
              </div>
              
              <div className="space-y-3">
                <NeonButton
                  onClick={() => router.push(`/ask/${profile.username}`)}
                  variant="primary"
                  size="lg"
                  glow
                  className="w-full"
                >
                  💬 Anonim Mesaj Gönder
                </NeonButton>
                
                <NeonButton
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="md"
                  className="w-full"
                >
                  🏠 Ana Sayfaya Dön
                </NeonButton>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  if (profile.showMode === 'song' && profile.customSong) {
    // Parse song data
    let songData;
    try {
      songData = JSON.parse(profile.customSong);
    } catch (e) {
      songData = { url: profile.customSong };
    }
    
    const isSpotify = songData.url.includes('spotify');
    const isYouTube = songData.url.includes('youtube') || songData.url.includes('youtu.be');
    
    // Generate embed URL
    let embedUrl = '';
    if (isSpotify) {
      // Extract Spotify track ID and create embed URL
      const match = songData.url.match(/track\/([a-zA-Z0-9]+)/);
      if (match) {
        embedUrl = `https://open.spotify.com/embed/track/${match[1]}`;
      }
    } else if (isYouTube) {
      // Extract YouTube video ID and create embed URL
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = songData.url.match(regExp);
      if (match && match[2].length === 11) {
        embedUrl = `https://www.youtube.com/embed/${match[2]}`;
      }
    }

    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          <AnimatedCard direction="up" className="text-center">
            <div className="mb-8">
              <div className="text-8xl mb-4">🎵</div>
              
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4">
                {songData.title || 'Şarkı Önerisi'}
              </h1>
              
              {songData.artist && (
                <p className="text-xl text-gray-300 mb-6">
                  <span className="text-purple-400">Sanatçı:</span> {songData.artist}
                </p>
              )}
              
              <div className="glass-effect p-6 rounded-xl cyber-border mb-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  {isSpotify && <span className="text-4xl">🎧</span>}
                  {isYouTube && <span className="text-4xl">📺</span>}
                  {!isSpotify && !isYouTube && <span className="text-4xl">🎶</span>}
                  
                  <span className="text-2xl font-bold text-purple-300">
                    {isSpotify ? 'Spotify' : isYouTube ? 'YouTube' : 'Müzik'}
                  </span>
                </div>
                
                {embedUrl ? (
                  <div className="mb-6">
                    <div className="relative w-full" style={{ paddingBottom: isYouTube ? '56.25%' : '380px' }}>
                      <iframe
                        src={embedUrl}
                        className={`absolute top-0 left-0 w-full ${
                          isYouTube ? 'h-full' : 'h-96'
                        } rounded-lg`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        title={`${songData.title || 'Şarkı'} - ${songData.artist || 'Bilinmeyen Sanatçı'}`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      {isSpotify ? '🎧 Direkt olarak Spotify\'dan dinle' :
                       isYouTube ? '📺 Direkt olarak YouTube\'dan izle' :
                       '🎶 Embed player'}. Sorun yaşıyorsan aşağıdaki butonu kullan.
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 p-6 bg-gray-800/50 rounded-lg border border-gray-600">
                    <div className="text-4xl mb-3">🔗</div>
                    <p className="text-gray-300 mb-4">
                      Bu platform için embed desteklenmiyorum ama linki açabilirsin!
                    </p>
                  </div>
                )}
                
                <NeonButton
                  onClick={() => window.open(songData.url, '_blank')}
                  variant={embedUrl ? "secondary" : "primary"}
                  size="lg"
                  glow={!embedUrl}
                  className="w-full mb-4"
                >
                  {isSpotify ? '🎧 Spotify\'da Aç' : isYouTube ? '📺 YouTube\'da Aç' : '🎶 Şarkıyı Aç'}
                </NeonButton>
                
                <p className="text-xs text-gray-400">
                  {isSpotify ? 'Spotify uygulamanız yoksa web player açılacak' :
                   isYouTube ? 'YouTube\'da şarkıyı dinleyebilirsiniz' :
                   'Müzik bağlantısı yeni sekmede açılacak'}
                </p>
              </div>
              
              <div className="text-sm text-gray-400 mb-6">
                <p>Bu şarkı <span className="text-purple-400 font-bold">@{profile.username}</span> tarafından paylaşıldı</p>
              </div>
              
              <div className="space-y-3">
                <NeonButton
                  onClick={() => router.push(`/ask/${profile.username}`)}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  💬 Anonim Mesaj Gönder
                </NeonButton>
                
                <NeonButton
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="md"
                  className="w-full"
                >
                  🏠 Ana Sayfaya Dön
                </NeonButton>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Default Profile Mode Display (Full Profile)
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <AnimatedCard glow>
          {/* Header */}
          <div className="text-center mb-8">
            {/* Profile Icon */}
            <div className="text-6xl mb-4">
              {profile.type === 'business' ? '🏢' : 
               profile.type === 'car' ? '🚗' : 
               profile.type === 'tshirt' ? '👕' : 
               profile.type === 'pet' ? '🐶' : '👤'}
            </div>
            
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-2">
              {displayName}
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">@{profile.username}</p>
            
            {bio && (
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {bio}
              </p>
            )}
            
            {/* Profile Type Badge */}
            <div className="inline-block bg-purple-900/30 border border-purple-500/30 rounded-full px-3 py-1 text-sm text-purple-300 mb-6">
              {profile.type === 'personal' ? 'Kişisel Profil' : 
               profile.type === 'business' ? 'İş Profili' : 
               profile.type === 'car' ? 'Araç Profili' : 
               profile.type === 'tshirt' ? 'T-Shirt Profili' : 
               profile.type === 'pet' ? 'Evcil Hayvan Profili' : 'Profil'}
            </div>
          </div>

          {/* Profile Analytics */}
          <ProfileAnalytics 
            profileId={profile.id}
            initialViews={profile.stats?.views || 0}
            initialScans={profile.stats?.scans || 0}
            initialClicks={profile.stats?.clicks || 0}
            followersCount={profile.stats?.followers || 0}
          />

          {/* Social Links */}
          {profile.socialLinks && profile.socialLinks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-purple-400 mb-4 text-center">🔗 Sosyal Medya</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {profile.socialLinks.map((link: any, index: number) => (
                  <NeonButton
                    key={index}
                    onClick={() => handleLinkClick(profile.id, link.url)}
                    variant="outline"
                    size="sm"
                  >
                    {link.icon || '🌐'} {link.label}
                  </NeonButton>
                ))}
              </div>
            </div>
          )}

          {/* Stats and Follow */}
          <div className="mb-8">
            {/* Profile Stats */}
            <ProfileStats 
              profileId={profile.id}
              initialFollowersCount={profile.stats?.followers || 0}
              initialFollowingCount={0} // We'll implement this later
              onFollowersClick={() => setShowFollowersModal(true)}
              onFollowingClick={() => setShowFollowingModal(true)}
            />
            
            {/* Follow Button */}
            {!isOwner && currentUser && (
              <div className="flex justify-center">
                <ProfileFollowButton
                  profileId={profile.id}
                  followerProfileId="" // We'll need to get the follower's profile ID
                  onFollowChange={(isFollowing) => {
                    // Could update stats or show notification here
                  }}
                  className="min-w-[200px]"
                />
              </div>
            )}
            
            {/* Owner Actions */}
            {isOwner && (
              <div className="flex justify-center mt-4">
                <NeonButton
                  onClick={() => router.push('/dashboard/profile')}
                  variant="secondary"
                  size="sm"
                >
                  ✏️ Profili Düzenle
                </NeonButton>
              </div>
            )}
          </div>

          {/* Profile Statistics */}
          <div className="mb-8">
            <SocialStats 
              userId={profile.ownerUid} 
            />
          </div>

          {/* Messaging Section */}
          {!isOwner && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-purple-400 mb-4 text-center">✉️ Mesaj Gönder</h2>
              <ProfileMessageSender 
                profileId={profile.id}
                profileOwnerUid={profile.ownerUid}
                onMessageSent={() => {
                  // Could add notification or other actions here
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isOwner && (
              <>
                <NeonButton
                  onClick={() => router.push(`/ask/${profile.username}`)}
                  variant="primary"
                  size="lg"
                  glow
                  className="w-full"
                >
                  💬 Anonim Mesaj Gönder
                </NeonButton>
                
                <NeonButton
                  onClick={() => router.push(`/message/${profile.username}`)}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  📩 Normal Mesaj Gönder
                </NeonButton>
              </>
            )}
            
            <NeonButton
              onClick={() => router.push('/')}
              variant="outline"
              size="md"
              className="w-full"
            >
              🏠 Ana Sayfaya Dön
            </NeonButton>
          </div>
        </AnimatedCard>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <ProfileFollowList 
          profileId={profile.id} 
          type="followers" 
          onClose={() => setShowFollowersModal(false)} 
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <ProfileFollowList 
          profileId={profile.id} 
          type="following" 
          onClose={() => setShowFollowingModal(false)} 
        />
      )}
    </div>
  );
}