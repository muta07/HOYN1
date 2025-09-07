// src/app/u/[username]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, UserProfile, BusinessProfile } from '@/lib/firebase';
import { getUserQRMode, QRModeData, NoteContent, SongContent, getEmbedUrl } from '@/lib/qr-modes';
import { incrementProfileViews } from '@/lib/stats';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import ProfileStats from '@/components/ui/ProfileStats';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';
import { ThemedCard, ThemedButton, ThemedText, ThemedBadge } from '@/components/ui/ThemedComponents';
import FollowButton from '@/components/social/FollowButton';
import SocialStats from '@/components/social/SocialStats';

type ProfileType = UserProfile | BusinessProfile;

interface PageProps {
  params: {
    username: string;
  };
}

export default function UserProfilePage({ params }: PageProps) {
  const { username } = params;
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<ProfileType | null>(null);
  const [qrMode, setQrMode] = useState<QRModeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<NoteContent | null>(null);
  const [songContent, setSongContent] = useState<SongContent | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        setError(null);

        // First, try to find user in 'users' collection
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('username', '==', username));
        const userQuerySnapshot = await getDocs(userQuery);
        
        if (!userQuerySnapshot.empty) {
          // Found in users collection
          const userDoc = userQuerySnapshot.docs[0];
          const userData = userDoc.data() as UserProfile;
          setUserProfile(userData);
          
          // Load QR mode configuration
          const qrModeData = await getUserQRMode(userData.uid);
          setQrMode(qrModeData);

          // Parse QR mode content
          if (qrModeData?.mode === 'note' && qrModeData.content) {
            try {
              const parsedNote = JSON.parse(qrModeData.content) as NoteContent;
              setNoteContent(parsedNote);
            } catch (error) {
              // Fallback for plain text content
              setNoteContent({ 
                text: qrModeData.content, 
                title: '', 
                emoji: '📝' 
              });
            }
          } else if (qrModeData?.mode === 'song' && qrModeData.content) {
            try {
              const parsedSong = JSON.parse(qrModeData.content) as SongContent;
              setSongContent(parsedSong);
            } catch (error) {
              // Fallback for plain URL content
              setSongContent({ 
                url: qrModeData.content, 
                platform: 'other', 
                title: '', 
                artist: '' 
              });
            }
          }

          // Increment profile views (if viewing someone else's profile)
          if (currentUser && currentUser.uid !== userData.uid) {
            incrementProfileViews(userData.uid).catch(error => {
              console.error('Failed to track profile view:', error);
            });
          }
          
          return;
        }
        
        // If not found in users, try businesses collection
        const businessesRef = collection(db, 'businesses');
        const businessQuery = query(businessesRef, where('username', '==', username));
        const businessQuerySnapshot = await getDocs(businessQuery);
        
        if (!businessQuerySnapshot.empty) {
          // Found in businesses collection
          const businessDoc = businessQuerySnapshot.docs[0];
          const businessData = businessDoc.data() as BusinessProfile;
          setUserProfile(businessData);
          
          // Load QR mode configuration
          const qrModeData = await getUserQRMode(businessData.uid);
          setQrMode(qrModeData);

          // Parse QR mode content
          if (qrModeData?.mode === 'note' && qrModeData.content) {
            try {
              const parsedNote = JSON.parse(qrModeData.content) as NoteContent;
              setNoteContent(parsedNote);
            } catch (error) {
              // Fallback for plain text content
              setNoteContent({ 
                text: qrModeData.content, 
                title: '', 
                emoji: '📝' 
              });
            }
          } else if (qrModeData?.mode === 'song' && qrModeData.content) {
            try {
              const parsedSong = JSON.parse(qrModeData.content) as SongContent;
              setSongContent(parsedSong);
            } catch (error) {
              // Fallback for plain URL content
              setSongContent({ 
                url: qrModeData.content, 
                platform: 'other', 
                title: '', 
                artist: '' 
              });
            }
          }

          // Increment profile views (if viewing someone else's profile)
          if (currentUser && currentUser.uid !== businessData.uid) {
            incrementProfileViews(businessData.uid).catch(error => {
              console.error('Failed to track profile view:', error);
            });
          }
          
          return;
        }
        
        // Not found in either collection
        setError('Kullanıcı bulunamadı');

      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Profil yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [username, currentUser]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Profil yükleniyor..." />
      </div>
    );
  }

  // Show error state
  if (error || !userProfile) {
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

  // Get display name
  const displayName = 'displayName' in userProfile ? userProfile.displayName : userProfile.nickname || userProfile.username;
  
  // Check if this is a business profile
  const isBusinessProfile = 'companyName' in userProfile;
  const businessProfile = isBusinessProfile ? userProfile as BusinessProfile : null;
  
  // Get bio - handle both profile types
  const bio = 'bio' in userProfile ? userProfile.bio : businessProfile?.description;

  // Note Mode Display
  if (qrMode?.mode === 'note' && noteContent) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatedCard direction="up" className="text-center">
            <div className="mb-8">
              {/* Emoji */}
              {noteContent.emoji && (
                <div className="text-8xl mb-4">{noteContent.emoji}</div>
              )}
              
              {/* Title */}
              {noteContent.title && (
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4">
                  {noteContent.title}
                </h1>
              )}
              
              {/* Note Text */}
              <div className="glass-effect p-8 rounded-xl cyber-border mb-6">
                <p className="text-xl leading-relaxed text-gray-100 whitespace-pre-wrap">
                  {noteContent.text}
                </p>
              </div>
              
              {/* User Info */}
              <div className="text-sm text-gray-400 mb-6">
                <p>Bu mesaj <span className="text-purple-400 font-bold">@{userProfile.username}</span> tarafından gönderildi</p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <NeonButton
                  onClick={() => router.push(`/ask/${userProfile.username}`)}
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

  // Song Mode Display with Enhanced Embeds
  if (qrMode?.mode === 'song' && songContent) {
    const isSpotify = songContent.platform === 'spotify' || songContent.url.includes('spotify');
    const isYouTube = songContent.platform === 'youtube' || songContent.url.includes('youtube');
    const embedUrl = getEmbedUrl(songContent);
    
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          <AnimatedCard direction="up" className="text-center">
            <div className="mb-8">
              {/* Music Icon */}
              <div className="text-8xl mb-4">🎵</div>
              
              {/* Song Info */}
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4">
                {songContent.title || 'Şarkı Önerisi'}
              </h1>
              
              {songContent.artist && (
                <p className="text-xl text-gray-300 mb-6">
                  <span className="text-purple-400">Sanatçı:</span> {songContent.artist}
                </p>
              )}
              
              {/* Music Player / Embed */}
              <div className="glass-effect p-6 rounded-xl cyber-border mb-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  {isSpotify && <span className="text-4xl">🎧</span>}
                  {isYouTube && <span className="text-4xl">📺</span>}
                  {!isSpotify && !isYouTube && <span className="text-4xl">🎶</span>}
                  
                  <span className="text-2xl font-bold text-purple-300">
                    {isSpotify ? 'Spotify' : isYouTube ? 'YouTube' : 'Müzik'}
                  </span>
                </div>
                
                {/* Embed Player */}
                {embedUrl && (isSpotify || isYouTube) ? (
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
                        title={`${songContent.title || 'Şarkı'} - ${songContent.artist || 'Bilinmeyen Sanatçı'}`}
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
                
                {/* Fallback Play Button */}
                <NeonButton
                  onClick={() => window.open(songContent.url, '_blank')}
                  variant={embedUrl && (isSpotify || isYouTube) ? "secondary" : "primary"}
                  size="lg"
                  glow={!embedUrl || (!isSpotify && !isYouTube)}
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
              
              {/* Song Details */}
              {(songContent.title || songContent.artist) && (
                <div className="glass-effect p-4 rounded-lg cyber-border mb-6 bg-purple-900/10">
                  <h3 className="text-purple-300 font-bold mb-2">🎼 Şarkı Detayları</h3>
                  {songContent.title && (
                    <p className="text-sm text-gray-300">
                      <span className="text-purple-400">Başlık:</span> {songContent.title}
                    </p>
                  )}
                  {songContent.artist && (
                    <p className="text-sm text-gray-300">
                      <span className="text-purple-400">Sanatçı:</span> {songContent.artist}
                    </p>
                  )}
                  <p className="text-sm text-gray-300">
                    <span className="text-purple-400">Platform:</span> {isSpotify ? 'Spotify' : isYouTube ? 'YouTube' : 'Diğer'}
                  </p>
                </div>
              )}
              
              {/* User Info */}
              <div className="text-sm text-gray-400 mb-6">
                <p>Bu şarkı <span className="text-purple-400 font-bold">@{userProfile.username}</span> tarafından paylaşıldı</p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <NeonButton
                  onClick={() => router.push(`/ask/${userProfile.username}`)}
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
                
                <NeonButton
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${songContent.title || 'Şarkı Önerisi'} - ${songContent.artist || userProfile.username}`,
                        text: `${userProfile.username} adlı kullanıcı sana bir şarkı öneriyor!`,
                        url: window.location.href
                      }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link panoya kopyalandı!');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  📤 Bu Şarkıyı Paylaş
                </NeonButton>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Default Profile Mode Display
  return (
    <ThemedProfileWrapper profile={userProfile}>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <ThemedCard variant="default" glow>
            {/* Header */}
            <div className="text-center mb-12">
              {/* Business Icon or User Icon */}
              <div className="text-8xl mb-4">
                {isBusinessProfile ? '🏢' : '👤'}
              </div>
              
              <ThemedText size="4xl" weight="black" variant="primary" glow className="mb-4">
                {displayName}
              </ThemedText>
              
              {isBusinessProfile && businessProfile?.companyName !== displayName && (
                <ThemedText size="2xl" variant="default" className="mb-2">
                  {businessProfile?.companyName}
                </ThemedText>
              )}
              
              <ThemedText size="xl" variant="muted" className="mb-2">
                @{userProfile.username}
              </ThemedText>
              
              {/* Business Type & Sector */}
              {isBusinessProfile && (businessProfile?.businessType || businessProfile?.sector) && (
                <div className="flex justify-center gap-2 mb-4">
                  {businessProfile?.businessType && (
                    <ThemedBadge variant="primary" size="md">
                      {businessProfile.businessType}
                    </ThemedBadge>
                  )}
                  {businessProfile?.sector && (
                    <ThemedBadge variant="accent" size="md">
                      {businessProfile.sector}
                    </ThemedBadge>
                  )}
                </div>
              )}
              
              {bio && (
                <ThemedText variant="muted" className="max-w-2xl mx-auto mb-4">
                  {bio}
                </ThemedText>
              )}
            
            {/* Business Info */}
            {isBusinessProfile && (
                <div className="max-w-2xl mx-auto mb-6">
                  {/* Founded Year & Employee Count */}
                  {(businessProfile?.foundedYear || businessProfile?.employeeCount) && businessProfile?.businessSettings?.showFoundedYear && (
                    <div className="flex justify-center gap-6 text-sm mb-4">
                      {businessProfile?.foundedYear && businessProfile?.businessSettings?.showFoundedYear && (
                        <ThemedText size="sm" variant="muted">
                          📅 {businessProfile.foundedYear} yılından beri
                        </ThemedText>
                      )}
                      {businessProfile?.employeeCount && businessProfile?.businessSettings?.showEmployeeCount && (
                        <ThemedText size="sm" variant="muted">
                          👥 {businessProfile.employeeCount}
                        </ThemedText>
                      )}
                    </div>
                  )}
                  
                  {/* Location */}
                  {businessProfile?.location?.city && businessProfile?.businessSettings?.showLocation && (
                    <ThemedText size="sm" variant="muted" className="mb-4 block text-center">
                      📍 {businessProfile.location.city}
                      {businessProfile.location.district && `, ${businessProfile.location.district}`}
                      {businessProfile.location.country && `, ${businessProfile.location.country}`}
                    </ThemedText>
                  )}
                  
                  {/* Services */}
                  {businessProfile?.services && businessProfile.services.length > 0 && (
                    <div className="mb-6">
                      <ThemedText size="base" weight="bold" variant="primary" className="mb-3 block text-center">
                        ⚙️ Hizmetlerimiz
                      </ThemedText>
                      <div className="flex flex-wrap justify-center gap-2">
                        {businessProfile.services.slice(0, 6).map((service, index) => (
                          <ThemedBadge key={index} variant="secondary" size="sm">
                            {service}
                          </ThemedBadge>
                        ))}
                        {businessProfile.services.length > 6 && (
                          <ThemedBadge variant="accent" size="sm">
                            +{businessProfile.services.length - 6} diğer
                          </ThemedBadge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Working Hours */}
                  {businessProfile?.workingHours && businessProfile?.businessSettings?.showWorkingHours && (
                    <div className="mb-6">
                      <ThemedText size="base" weight="bold" variant="primary" className="mb-3 block text-center">
                        🕐 Çalışma Saatleri
                      </ThemedText>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {Object.entries({
                          monday: 'Pzt', tuesday: 'Sal', wednesday: 'Çar', thursday: 'Per',
                          friday: 'Cum', saturday: 'Cmt', sunday: 'Paz'
                        }).map(([day, shortName]) => {
                          const hours = businessProfile.workingHours?.[day as keyof typeof businessProfile.workingHours];
                          if (!hours) return null;
                          return (
                            <ThemedCard key={day} variant="secondary" className="p-2 text-center">
                              <ThemedText weight="bold" variant="primary" size="sm" className="block">
                                {shortName}
                              </ThemedText>
                              <ThemedText size="xs" variant="default">
                                {hours}
                              </ThemedText>
                            </ThemedCard>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Social Stats and Follow Button */}
            <div className="mb-8 space-y-4">
              {/* Social Stats */}
              <SocialStats 
                userId={userProfile.uid}
                username={userProfile.username}
                initialFollowersCount={userProfile.followersCount || 0}
                initialFollowingCount={userProfile.followingCount || 0}
                variant="inline"
                className="justify-center"
                clickable={true}
              />
              
              {/* Follow Button */}
              <div className="flex justify-center">
                <FollowButton
                  targetUserId={userProfile.uid}
                  targetUsername={userProfile.username}
                  targetDisplayName={displayName}
                  className="min-w-[200px]"
                />
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="mb-10">
              <ProfileStats 
                userId={userProfile.uid} 
                isOwnProfile={currentUser?.uid === userProfile.uid} 
              />
            </div>

            {/* Social Links & Contact */}
            {(
              ('instagram' in userProfile && (userProfile.instagram || userProfile.twitter)) || 
              (isBusinessProfile && (
                businessProfile?.socialMedia?.instagram || 
                businessProfile?.socialMedia?.facebook || 
                businessProfile?.socialMedia?.linkedin || 
                businessProfile?.phone || 
                businessProfile?.website
              ))
            ) && (
              <div className="mb-10">
                {/* Personal Social Media */}
                {'instagram' in userProfile && (userProfile.instagram || userProfile.twitter) && (
                  <div className="flex justify-center gap-4 mb-4">
                    {userProfile.instagram && (
                      <ThemedButton
                        onClick={() => window.open(`https://instagram.com/${userProfile.instagram}`, '_blank')}
                        variant="secondary"
                        size="md"
                      >
                        📸 Instagram
                      </ThemedButton>
                    )}
                    {userProfile.twitter && (
                      <ThemedButton
                        onClick={() => window.open(`https://twitter.com/${userProfile.twitter}`, '_blank')}
                        variant="secondary"
                        size="md"
                      >
                        🐦 Twitter
                      </ThemedButton>
                    )}
                  </div>
                )}
                
                {/* Business Social Media & Contact */}
                {isBusinessProfile && (
                  <div className="space-y-4">
                    {/* Business Social Media */}
                    {(businessProfile?.socialMedia?.instagram || businessProfile?.socialMedia?.facebook || 
                      businessProfile?.socialMedia?.linkedin) && (
                      <div className="flex justify-center gap-3 flex-wrap">
                        {businessProfile?.socialMedia?.instagram && (
                          <NeonButton
                            onClick={() => window.open(`https://instagram.com/${businessProfile.socialMedia!.instagram}`, '_blank')}
                            variant="secondary"
                            size="sm"
                          >
                            📸 Instagram
                          </NeonButton>
                        )}
                        {businessProfile?.socialMedia?.facebook && (
                          <NeonButton
                            onClick={() => window.open(`https://facebook.com/${businessProfile.socialMedia!.facebook}`, '_blank')}
                            variant="secondary"
                            size="sm"
                          >
                            🔵 Facebook
                          </NeonButton>
                        )}
                        {businessProfile?.socialMedia?.linkedin && (
                          <NeonButton
                            onClick={() => window.open(`https://linkedin.com/company/${businessProfile.socialMedia!.linkedin}`, '_blank')}
                            variant="secondary"
                            size="sm"
                          >
                            💼 LinkedIn
                          </NeonButton>
                        )}
                      </div>
                    )}
                    
                    {/* Business Contact */}
                    {(businessProfile?.phone || businessProfile?.website || businessProfile?.contactInfo?.whatsapp) && (
                      <div className="flex justify-center gap-3 flex-wrap">
                        {businessProfile?.phone && (
                          <NeonButton
                            onClick={() => window.open(`tel:${businessProfile.phone}`, '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            📞 {businessProfile.phone}
                          </NeonButton>
                        )}
                        {businessProfile?.contactInfo?.whatsapp && (
                          <NeonButton
                            onClick={() => window.open(`https://wa.me/${businessProfile.contactInfo!.whatsapp!.replace(/[^0-9]/g, '')}`, '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            📱 WhatsApp
                          </NeonButton>
                        )}
                        {businessProfile?.website && (
                          <NeonButton
                            onClick={() => window.open(businessProfile.website!.startsWith('http') ? businessProfile.website! : `https://${businessProfile.website}`, '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            🌐 Website
                          </NeonButton>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="text-center space-y-4">
              {('allowAnonymous' in userProfile && userProfile.allowAnonymous !== false) && (
                <div>
                  <ThemedButton
                    onClick={() => router.push(`/ask/${userProfile.username}`)}
                    variant="primary"
                    size="lg"
                    glow
                    className="w-full max-w-md"
                  >
                    💬 Anonim Mesaj Gönder
                  </ThemedButton>
                  <ThemedText size="sm" variant="muted" className="mt-2 block">
                    Kimliğin gizli kalacak, sadece mesajın iletilecek
                  </ThemedText>
                </div>
              )}
              
              <ThemedButton
                onClick={() => router.push('/')}
                variant="outline"
                size="md"
                className="w-full max-w-md"
              >
                🏠 Ana Sayfaya Dön
              </ThemedButton>
            </div>
          </ThemedCard>
        </div>
      </div>
      </ThemedProfileWrapper>
    );
  }
}