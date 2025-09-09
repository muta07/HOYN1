'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getProfileMessages, 
  onProfileMessagesSnapshot,
  replyToProfileMessage,
  getProfileById,
  getUserProfiles
} from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import { ProfileMessage, Profile } from '@/lib/firebase';

export default function ProfileMessagesPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ProfileMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ProfileMessage | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user profiles
  useEffect(() => {
    if (!user?.uid) return;

    const loadProfiles = async () => {
      try {
        setLoading(true);
        const userProfiles = await getUserProfiles(user.uid);
        setProfiles(userProfiles);
        
        // Auto-select first profile if available
        if (userProfiles.length > 0) {
          setSelectedProfile(userProfiles[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load profiles:', error);
        setLoading(false);
      }
    };

    loadProfiles();
  }, [user?.uid]);

  // Load messages for selected profile
  useEffect(() => {
    if (!selectedProfile || !user?.uid) return;

    let unsubscribe: (() => void) | null = null;

    const loadMessages = async () => {
      try {
        // Set up real-time listener
        const unsub = onProfileMessagesSnapshot(selectedProfile.id, (snapshotMessages) => {
          setMessages(snapshotMessages);
          
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        });
        
        // Handle unsubscribe function
        unsubscribe = unsub as unknown as (() => void) | null;
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();

    return () => {
      if (unsubscribe) {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        } else if ('unsubscribe' in unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
          unsubscribe.unsubscribe();
        }
      }
    };
  }, [selectedProfile, user?.uid]);

  // Handle reply to message
  const handleReply = async (message: ProfileMessage) => {
    if (!replyInput.trim() || !selectedProfile) return;

    setSendingReply(true);
    try {
      const success = await replyToProfileMessage(selectedProfile.id, message.id, replyInput);
      
      if (success) {
        setReplyInput('');
        setReplyingTo(null);
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Yanıt gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSendingReply(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Mesajlar yükleniyor..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Giriş Yapın</h2>
          <p className="text-gray-400 mb-6">Mesajları görüntülemek için giriş yapmanız gerekiyor.</p>
          <NeonButton onClick={() => window.location.href = '/auth/login'} className="px-8">
            Giriş Yap
          </NeonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg border-b border-purple-900/50 z-10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Profil Mesajları
          </h1>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Profiles List */}
        <div className="w-full md:w-1/3 border-r border-gray-800 bg-gray-900/50 overflow-y-auto">
          {profiles.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-lg">Henüz profiliniz yok</p>
              <p className="text-sm opacity-75">
                Mesaj almak için bir profil oluşturun
              </p>
              <NeonButton 
                onClick={() => window.location.href = '/dashboard/profile'} 
                variant="primary"
                size="sm"
                className="mt-4"
              >
                Profil Oluştur
              </NeonButton>
            </div>
          ) : (
            <div className="space-y-0">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                    selectedProfile?.id === profile.id 
                      ? 'bg-purple-900/20 border-l-4 border-purple-500' 
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-lg">
                            {profile.type === 'business' ? '🏢' : 
                             profile.type === 'car' ? '🚗' : 
                             profile.type === 'tshirt' ? '👕' : 
                             profile.type === 'pet' ? '🐶' : '👤'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white truncate">
                            {profile.displayName}
                          </h3>
                          <p className="text-xs text-gray-400">
                            @{profile.slug}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 truncate max-w-[200px] mb-1">
                        {profile.bio || 'Açıklama eklenmemiş'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="w-full md:w-2/3 flex flex-col">
          {selectedProfile ? (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {selectedProfile.type === 'business' ? '🏢' : 
                         selectedProfile.type === 'car' ? '🚗' : 
                         selectedProfile.type === 'tshirt' ? '👕' : 
                         selectedProfile.type === 'pet' ? '🐶' : '👤'}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">
                        {selectedProfile.displayName}
                      </h2>
                      <p className="text-sm text-gray-400">
                        @{selectedProfile.slug}
                      </p>
                    </div>
                  </div>
                  <NeonButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedProfile(null)}
                  >
                    Geri
                  </NeonButton>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">💬</div>
                    <p>Henüz mesaj yok</p>
                    <p className="text-sm opacity-75 mt-2">
                      Profilinizi ziyaret eden kullanıcılar buraya mesaj gönderebilir
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="space-y-3">
                      {/* Received Message */}
                      <div className="flex justify-start">
                        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 border border-gray-600">
                          {/* Sender Info */}
                          <div className="flex items-center gap-2 mb-1">
                            {message.isAnonymous ? (
                              <>
                                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">👻</span>
                                </div>
                                <span className="text-xs font-semibold text-purple-300">Anonymous</span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-xs">👤</span>
                                </div>
                                <span className="text-xs font-semibold text-blue-300">Visitor</span>
                              </>
                            )}
                          </div>
                          
                          {/* Message Content */}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Timestamp */}
                          <p className="text-xs mt-1 opacity-75">
                            {message.timestamp.toLocaleDateString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Reply */}
                      {message.replied && message.replyContent && (
                        <div className="flex justify-end">
                          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30">
                            <p className="whitespace-pre-wrap">{message.replyContent}</p>
                            <p className="text-xs mt-1 opacity-75 text-right">
                              You · {message.timestamp.toLocaleDateString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Reply Button (only for non-anonymous messages) */}
                      {!message.isAnonymous && !message.replied && (
                        <div className="flex justify-start">
                          <NeonButton
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyingTo(message)}
                          >
                            Yanıtla
                          </NeonButton>
                        </div>
                      )}

                      {/* Reply Input */}
                      {replyingTo?.id === message.id && (
                        <div className="flex justify-end">
                          <div className="max-w-xs lg:max-w-md w-full">
                            <textarea
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              placeholder="Yanıtınızı yazın..."
                              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:border-purple-500 focus:outline-none mb-2"
                              rows={2}
                              maxLength={300}
                            />
                            <div className="flex gap-2 justify-end">
                              <NeonButton
                                onClick={() => setReplyingTo(null)}
                                variant="outline"
                                size="sm"
                              >
                                İptal
                              </NeonButton>
                              <NeonButton
                                onClick={() => handleReply(message)}
                                disabled={!replyInput.trim() || sendingReply}
                                variant="primary"
                                size="sm"
                              >
                                {sendingReply ? 'Gönderiliyor...' : 'Gönder'}
                              </NeonButton>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">
                  Profil Mesajları
                </h3>
                <p className="opacity-75">Bir profil seçin veya profil sayfalarından mesaj gönderin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}