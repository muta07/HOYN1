// src/app/u/[username]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserQRMode, QRModeData, NoteContent, SongContent } from '@/lib/qr-modes';
import { incrementProfileViews } from '@/lib/stats';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import ProfileStats from '@/components/ui/ProfileStats';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  nickname?: string;
  username: string;
  bio?: string;
  instagram?: string;
  twitter?: string;
  allowAnonymous?: boolean;
  createdAt: any;
  updatedAt: any;
}

interface PageProps {
  params: {
    username: string;
  };
}

export default function UserProfilePage({ params }: PageProps) {
  const { username } = params;
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

        // Find user by username (which comes from email)
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Kullanıcı bulunamadı');
          return;
        }

        const userDoc = querySnapshot.docs[0];
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
  const displayName = userProfile.nickname || userProfile.displayName || userProfile.username;

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

  // Song Mode Display
  if (qrMode?.mode === 'song' && songContent) {
    const isSpotify = songContent.platform === 'spotify' || songContent.url.includes('spotify');
    const isYouTube = songContent.platform === 'youtube' || songContent.url.includes('youtube');
    
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
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
              
              {/* Platform Info */}
              <div className="glass-effect p-6 rounded-xl cyber-border mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  {isSpotify && <span className="text-3xl">🎧</span>}
                  {isYouTube && <span className="text-3xl">📺</span>}
                  {!isSpotify && !isYouTube && <span className="text-3xl">🎶</span>}
                  
                  <span className="text-lg font-bold text-purple-300">
                    {isSpotify ? 'Spotify' : isYouTube ? 'YouTube' : 'Müzik'}
                  </span>
                </div>
                
                {/* Play Button */}
                <NeonButton
                  onClick={() => window.open(songContent.url, '_blank')}
                  variant="primary"
                  size="lg"
                  glow
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
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Default Profile Mode Display
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <AnimatedCard direction="up">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
              👤 {displayName}
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              @{userProfile.username}
            </p>
            {userProfile.bio && (
              <p className="text-gray-400 max-w-2xl mx-auto">
                {userProfile.bio}
              </p>
            )}
          </div>

          {/* Profile Statistics */}
          <div className="mb-10">
            <ProfileStats 
              userId={userProfile.uid} 
              isOwnProfile={currentUser?.uid === userProfile.uid} 
            />
          </div>

          {/* Social Links */}
          {(userProfile.instagram || userProfile.twitter) && (
            <div className="flex justify-center gap-4 mb-10">
              {userProfile.instagram && (
                <NeonButton
                  onClick={() => window.open(`https://instagram.com/${userProfile.instagram}`, '_blank')}
                  variant="secondary"
                  size="md"
                >
                  📸 Instagram
                </NeonButton>
              )}
              {userProfile.twitter && (
                <NeonButton
                  onClick={() => window.open(`https://twitter.com/${userProfile.twitter}`, '_blank')}
                  variant="secondary"
                  size="md"
                >
                  🐦 Twitter
                </NeonButton>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="text-center space-y-4">
            {userProfile.allowAnonymous !== false && (
              <div>
                <NeonButton
                  onClick={() => router.push(`/ask/${userProfile.username}`)}
                  variant="primary"
                  size="lg"
                  glow
                  className="w-full max-w-md"
                >
                  💬 Anonim Mesaj Gönder
                </NeonButton>
                <p className="text-sm text-gray-500 mt-2">
                  Kimliğin gizli kalacak, sadece mesajın iletilecek
                </p>
              </div>
            )}
            
            <NeonButton
              onClick={() => router.push('/')}
              variant="outline"
              size="md"
              className="w-full max-w-md"
            >
              🏠 Ana Sayfaya Dön
            </NeonButton>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}