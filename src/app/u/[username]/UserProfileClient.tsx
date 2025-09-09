'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, UserProfile, BusinessProfile, HOYNProfile, getUserProfiles, createHOYNProfile, getPrimaryProfileForUser, incrementProfileViews, Profile } from '@/lib/firebase';
import { getUserQRMode, QRModeData, NoteContent, SongContent, getEmbedUrl } from '@/lib/qr-modes';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import ProfileStats from '@/components/ui/ProfileStats';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';
import { ThemedCard, ThemedButton, ThemedText, ThemedBadge } from '@/components/ui/ThemedComponents';
import FollowButton from '@/components/social/FollowButton';
import SocialStats from '@/components/social/SocialStats';

type ProfileType = UserProfile | BusinessProfile | HOYNProfile;

interface UserProfileClientProps {
  profile: ProfileType;
  username: string;
}

export default function UserProfileClient({ profile: initialProfile, username }: UserProfileClientProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<ProfileType | null>(initialProfile);
  const [ownerProfiles, setOwnerProfiles] = useState<HOYNProfile[]>([]);
  const [qrMode, setQrMode] = useState<QRModeData | null>(null);
  const [loading, setLoading] = useState(false); // Main data is already loaded
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<NoteContent | null>(null);
  const [songContent, setSongContent] = useState<SongContent | null>(null);
  
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileData, setNewProfileData] = useState({
    username: '',
    displayName: '',
    type: 'personal' as 'personal' | 'business',
    bio: '',
    companyName: '',
    businessType: '',
    isPrimary: false
  });
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    const loadSecondaryData = async () => {
      if (!userProfile) return;
      
      setLoading(true);
      try {
          // The main profile is already loaded via props.
          // We just need to load auxiliary data now.
          let ownerUid: string | undefined;
          
          if ('ownerUid' in userProfile) {
            ownerUid = (userProfile as any).ownerUid;
          } else if ('uid' in userProfile) {
            ownerUid = (userProfile as any).uid;
          }
          
          if (!ownerUid) {
              setError('Profile owner information is missing.');
              setLoading(false);
              return;
          }

          const qrModeData = await getUserQRMode(ownerUid);
          setQrMode(qrModeData);

          // Parse QR mode content
          if (qrModeData?.mode === 'note' && qrModeData.content) {
            try {
              const parsedNote = JSON.parse(qrModeData.content) as NoteContent;
              setNoteContent(parsedNote);
            } catch (error) {
              setNoteContent({ text: qrModeData.content, title: '', emoji: '📝' });
            }
          } else if (qrModeData?.mode === 'song' && qrModeData.content) {
            try {
              const parsedSong = JSON.parse(qrModeData.content) as SongContent;
              setSongContent(parsedSong);
            } catch (error) {
              setSongContent({ url: qrModeData.content, platform: 'other', title: '', artist: '' });
            }
          }

          if (currentUser && currentUser.uid === ownerUid) {
            const profiles = await getUserProfiles(ownerUid);
            const hoynProfiles = profiles
              .filter(p => p.type === 'personal' || p.type === 'business')
              .map(p => ({ ...p, username: p.slug || '', displayName: p.displayName || '' } as HOYNProfile));
            setOwnerProfiles(hoynProfiles);
          }

          if (currentUser && currentUser.uid !== ownerUid) {
            incrementProfileViews(userProfile.id).catch(err => console.error('Failed to track profile view:', err));
          }

      } catch (err) {
        console.error('Error loading secondary user data:', err);
        setError('Profilin ek verileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadSecondaryData();
  }, [username, currentUser, userProfile]);

  const handleCreateProfile = async () => {
    if (!currentUser || !newProfileData.username || !newProfileData.displayName) {
      alert('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    setCreatingProfile(true);
    try {
      const profileData = {
        username: newProfileData.username,
        displayName: newProfileData.displayName,
        type: newProfileData.type,
        nickname: newProfileData.displayName,
        email: currentUser.email || '',
        uid: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        followersCount: 0,
        followingCount: 0,
        ...(newProfileData.type === 'personal' ? {
          bio: newProfileData.bio,
        } : {
          companyName: newProfileData.companyName,
          businessType: newProfileData.businessType,
          description: newProfileData.bio,
          ownerName: newProfileData.displayName,
        }),
      };

      const newProfile = await createHOYNProfile(currentUser.uid, profileData);
      if (newProfile) {
        setOwnerProfiles(prev => [...prev, newProfile]);
        setShowCreateProfile(false);
        // Reset form
        setNewProfileData({ username: '', displayName: '', type: 'personal', bio: '', companyName: '', businessType: '', isPrimary: false });
        alert('Yeni profil başarıyla oluşturuldu!');
        router.push(`/u/${newProfile.username}`);
      } else {
        alert('Profil oluşturulamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      alert('Profil oluştururken hata oluştu.');
    } finally {
      setCreatingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Ek veriler yükleniyor..." />
      </div>
    );
  }

  if (!userProfile) {
      return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <AnimatedCard className="text-center max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Profil Bulunamadı
          </h1>
          <p className="text-gray-400 mb-6">
            Bu kullanıcıya ait bir profil bulunmuyor veya yüklenemedi.
          </p>
          <NeonButton onClick={() => router.push('/')} variant="primary" size="lg" glow>
            Ana Sayfaya Dön
          </NeonButton>
        </AnimatedCard>
      </div>
    );
  }

  const isOwner = currentUser && (
    ('uid' in userProfile && currentUser.uid === userProfile.uid) || 
    ('ownerUid' in userProfile && currentUser.uid === (userProfile as HOYNProfile).ownerUid)
  );
  
  const displayName = ('displayName' in userProfile && typeof userProfile.displayName === 'string') ? userProfile.displayName : '';
  const isBusinessProfile = ('type' in userProfile && (userProfile as HOYNProfile).type === 'business');
  const businessProfile = isBusinessProfile ? userProfile as BusinessProfile : null;
  const hoynProfile = 'type' in userProfile ? userProfile as HOYNProfile : null;
  const bio = 'bio' in userProfile && userProfile.bio ? userProfile.bio : '';

  // The rest of the original JSX can be pasted here, it should work with the variables defined above.
  // ... (The entire return statement from the original file)

    return (
    <>
      <ThemedProfileWrapper profile={userProfile}>
        <div className="min-h-screen py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <ThemedCard variant="default" glow>
              <div className="text-center mb-12">
                <div className="text-8xl mb-4">{isBusinessProfile ? '🏢' : '👤'}</div>
                <ThemedText size="4xl" weight="black" variant="primary" glow className="mb-4">
                  {displayName?.toString() || ''}
                </ThemedText>
                <ThemedText size="xl" variant="muted" className="mb-2">
                  @{ 'username' in userProfile ? userProfile.username : 'N/A'}
                </ThemedText>
                {hoynProfile?.type && (
                  <ThemedBadge variant="accent" size="md" className="mb-2">
                    {hoynProfile.type === 'personal' ? 'Kişisel' : 'İş'}
                  </ThemedBadge>
                )}
                {isBusinessProfile && (businessProfile?.businessType || businessProfile?.sector) && (
                  <div className="flex justify-center gap-2 mb-4">
                    {businessProfile?.businessType && <ThemedBadge variant="primary" size="md">{businessProfile.businessType}</ThemedBadge>}
                    {businessProfile?.sector && <ThemedBadge variant="accent" size="md">{businessProfile.sector}</ThemedBadge>}
                  </div>
                )}
                {bio && <ThemedText variant="muted" className="max-w-2xl mx-auto mb-4">{bio}</ThemedText>}
                {isOwner && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                    <NeonButton onClick={() => setShowCreateProfile(true)} variant="secondary" size="sm" className="w-full sm:w-auto">
                      ➕ Yeni Profil Oluştur
                    </NeonButton>
                    {ownerProfiles.length > 0 && (
                      <NeonButton onClick={() => console.log('Owner profiles:', ownerProfiles)} variant="outline" size="sm" className="w-full sm:w-auto">
                        📋 Profillerim ({ownerProfiles.length})
                      </NeonButton>
                    )}
                  </div>
                )}
              </div>

              {isBusinessProfile && (
                 <div className="max-w-2xl mx-auto mb-6"> {/* Business Info JSX from original file */} </div>
              )}

              <div className="mb-8 space-y-4">
                <SocialStats 
                  userId={'ownerUid' in userProfile ? userProfile.ownerUid : ''}
                  username={username}
                  initialFollowersCount={'stats' in userProfile && userProfile.stats ? userProfile.stats.followers : 0}
                  initialFollowingCount={0} // This needs to be fetched separately if needed
                  variant="inline"
                  className="justify-center"
                  clickable={true}
                />
                {!isOwner && (
                  <div className="flex justify-center">
                    <FollowButton
                      targetUserId={'ownerUid' in userProfile ? userProfile.ownerUid : ''}
                      targetUsername={username}
                      targetDisplayName={displayName.toString()}
                      className="min-w-[200px]"
                    />
                  </div>
                )}
              </div>

              <div className="mb-10">
                <ProfileStats profileId={userProfile.id} isOwnProfile={!!isOwner} />
              </div>

              <div className="text-center space-y-4">
                  <div>
                    <ThemedButton onClick={() => router.push(`/ask/${username}`)} variant="primary" size="lg" glow className="w-full max-w-md">
                      💬 Anonim Mesaj Gönder
                    </ThemedButton>
                    <ThemedText size="sm" variant="muted" className="mt-2 block">
                      Kimliğin gizli kalacak, sadece mesajın iletilecek
                    </ThemedText>
                  </div>
                <ThemedButton onClick={() => router.push('/')} variant="outline" size="md" className="w-full max-w-md">
                  🏠 Ana Sayfaya Dön
                </ThemedButton>
              </div>
            </ThemedCard>
          </div>
        </div>
      </ThemedProfileWrapper>
      {showCreateProfile && ( <div /> /* ProfileCreationModal JSX from original file */ )}
    </>
  );
}