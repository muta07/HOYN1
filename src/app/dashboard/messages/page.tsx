'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserConversations, 
  getUserMessages, 
  onConversationsSnapshot, 
  onMessagesSnapshot,
  markMessageAsRead,
  getUserDisplayName
} from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import { Message, Conversation } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface ProcessedConversation {
  id: string;
  displayName: string;
  avatarUrl: string;
  lastMessage: string;
  lastUpdated: number;
  unreadCount: number;
  isAnonymous: boolean;
  participants: string[];
}

interface ProcessedMessage {
  id: string;
  senderId: string | null;
  senderName: string;
  text: string;
  timestamp: Date;
  isOwnMessage: boolean;
  isAnonymous: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ProcessedConversation[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'anonymous'>('inbox');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ProcessedConversation | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ProcessedMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load initial conversations and messages
        const [initialConversations, initialMessages] = await Promise.all([
          getUserConversations(user.uid),
          getUserMessages(user.uid)
        ]);
        
        const processed = await processConversations(initialConversations, user.uid);
        setConversations(processed);
        setAllMessages(initialMessages);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Set up real-time listeners
    const conversationsUnsub = onConversationsSnapshot(user.uid, (snapshotConversations) => {
      processConversations(snapshotConversations, user.uid).then(setConversations);
    });

    const messagesUnsub = onMessagesSnapshot(user.uid, (snapshotMessages) => {
      setAllMessages(snapshotMessages);
      
      // Update current conversation messages if one is selected
      if (selectedConversation) {
        updateCurrentMessages();
      }
    });

    // Store unsubscribe functions
    conversationsUnsubscribe = conversationsUnsub as unknown as (() => void) | null;
    messagesUnsubscribe = messagesUnsub as unknown as (() => void) | null;

    return () => {
      if (conversationsUnsubscribe) {
        if (typeof conversationsUnsubscribe === 'function') {
          conversationsUnsubscribe();
        } else if (conversationsUnsubscribe.unsubscribe) {
          conversationsUnsubscribe.unsubscribe();
        }
      }
      
      if (messagesUnsubscribe) {
        if (typeof messagesUnsubscribe === 'function') {
          messagesUnsubscribe();
        } else if (messagesUnsubscribe.unsubscribe) {
          messagesUnsubscribe.unsubscribe();
        }
      }
    };
  }, [user?.uid]);

  // Process conversations for display
  const processConversations = async (conversations: Conversation[], currentUserId: string): Promise<ProcessedConversation[]> => {
    return Promise.all(
      conversations.map(async (conv): Promise<ProcessedConversation> => {
        let displayName = '';
        let avatarUrl = '/api/placeholder/40/40';
        let isAnonymous = false;

        if (conv.isAnonymousThread) {
          displayName = 'Anonymous';
          isAnonymous = true;
        } else {
          // Find the other participant
          const otherParticipant = conv.participants.find(id => id !== currentUserId);
          if (otherParticipant) {
            displayName = await getUserDisplayName(otherParticipant);
            // Avatar would be fetched here in a real implementation
            avatarUrl = '/api/placeholder/40/40';
          } else {
            displayName = 'Unknown User';
          }
        }

        const unreadCount = conv.unreadCounts?.[currentUserId] || 0;
        // Handle lastUpdated as either Date or Firestore timestamp
        let lastMessageTime = 0;
        if (conv.lastUpdated) {
          if (conv.lastUpdated instanceof Date) {
            lastMessageTime = conv.lastUpdated.getTime();
          } else if (conv.lastUpdated && typeof (conv.lastUpdated as any).toDate === 'function') {
            lastMessageTime = (conv.lastUpdated as any).toDate().getTime();
          } else {
            lastMessageTime = new Date(conv.lastUpdated).getTime();
          }
        }

        return {
          id: conv.id,
          displayName,
          avatarUrl,
          lastMessage: conv.lastMessage || '',
          lastUpdated: lastMessageTime,
          unreadCount,
          isAnonymous,
          participants: conv.participants
        };
      })
    );
  };

  // Update messages for current conversation
  const updateCurrentMessages = () => {
    if (!selectedConversation || !allMessages.length) return;

    // For proper conversation filtering, we need to check messages for this specific conversation
    // Since messages now have recipientId and senderId, we can filter more accurately
    const conversationMessages = allMessages.filter(msg => {
      if (selectedConversation.isAnonymous) {
        // For anonymous conversations, filter by recipient and anonymous sender
        return msg.recipientId === user?.uid && msg.senderId === null;
      } else {
        // For normal conversations, check if either sender or recipient matches the participants
        const senderId = msg.senderId || null;
        return selectedConversation.participants.includes(senderId || '') || 
               selectedConversation.participants.includes(msg.recipientId);
      }
    });

    const processedMessages = conversationMessages
      .map(msg => {
        const senderId = msg.senderId || null;
        // Handle timestamp as either Date or Firestore timestamp
        let timestamp: Date;
        if (msg.timestamp instanceof Date) {
          timestamp = msg.timestamp;
        } else if (msg.timestamp && typeof (msg.timestamp as any).toDate === 'function') {
          timestamp = (msg.timestamp as any).toDate();
        } else {
          timestamp = new Date(msg.timestamp);
        }
        
        return {
          id: msg.id,
          senderId,
          senderName: msg.senderName,
          text: msg.text,
          timestamp,
          isOwnMessage: senderId === user?.uid,
          isAnonymous: senderId === null
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    setCurrentMessages(processedMessages);
    
    // Mark as read if it's not the anonymous thread and there are new messages
    if (!selectedConversation.isAnonymous && processedMessages.length > 0) {
      markMessageAsRead(selectedConversation.id, '', user!.uid);
    }

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Send message to conversation
  const sendMessageToConversation = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    setSendingMessage(true);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          recipientId: selectedConversation.isAnonymous 
            ? selectedConversation.id.replace('_anonymous', '') 
            : selectedConversation.participants.find(id => id !== user.uid),
          text: messageInput,
          isAnonymous: selectedConversation.isAnonymous,
          senderName: user.displayName
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Mesaj gönderilemedi: ' + (error as Error).message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Filter conversations by tab
  const filteredConversations = conversations.filter(conv => 
    activeTab === 'inbox' ? !conv.isAnonymous : conv.isAnonymous
  );

  // Get total unread for current tab
  const tabUnreadCount = filteredConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

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
      {/* Header with notification badge */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg border-b border-purple-900/50 z-10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mesajlar {totalUnread > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </h1>
          <div className="flex gap-2">
            <NeonButton 
              variant="outline" 
              size="sm" 
              className={activeTab === 'inbox' ? 'bg-purple-600 text-white' : ''}
              onClick={() => setActiveTab('inbox')}
            >
              Gelen Kutusu
              {activeTab === 'inbox' && tabUnreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                  {tabUnreadCount > 9 ? '9+' : tabUnreadCount}
                </span>
              )}
            </NeonButton>
            <NeonButton 
              variant="outline" 
              size="sm" 
              className={activeTab === 'anonymous' ? 'bg-purple-600 text-white' : ''}
              onClick={() => setActiveTab('anonymous')}
            >
              Anonim
            </NeonButton>
            <NeonButton 
              variant="primary" 
              size="sm" 
              onClick={() => router.push('/dashboard/messages/profile-messages')}
            >
              Profil Mesajları
            </NeonButton>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 border-r border-gray-800 bg-gray-900/50 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Henüz {activeTab === 'inbox' ? 'mesajınız' : 'anonim mesajınız'} yok</p>
              <p className="text-sm opacity-75">
                {activeTab === 'inbox' 
                  ? 'Profil sayfalarından mesaj gönderebilirsiniz' 
                  : 'Anonim mesajlar için profil sayfalarındaki anonim butonunu kullanın'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setTimeout(() => updateCurrentMessages(), 100);
                  }}
                  className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-purple-900/20 border-l-4 border-purple-500' 
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <img 
                          src={conversation.avatarUrl} 
                          alt={conversation.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold text-white truncate">
                            {conversation.displayName}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {conversation.isAnonymous ? 'Anonim' : conversation.participants.length + ' katılımcı'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 truncate max-w-[200px] mb-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-xs text-gray-500 mb-1">
                        {new Date(conversation.lastUpdated).toLocaleDateString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="w-full md:w-2/3 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedConversation.avatarUrl} 
                      alt={selectedConversation.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h2 className="font-semibold text-white">
                        {selectedConversation.displayName}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {selectedConversation.isAnonymous ? 'Anonim mesajlaşma' : 'Özel mesajlaşma'}
                      </p>
                    </div>
                  </div>
                  <NeonButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                  >
                    Geri
                  </NeonButton>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50" ref={messagesEndRef}>
                {currentMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">💬</div>
                    <p>Henüz mesaj yok</p>
                    <p className="text-sm opacity-75 mt-2">
                      {selectedConversation.isAnonymous 
                        ? 'Anonim mesaj göndererek sohbeti başlatın' 
                        : 'Mesaj göndererek sohbeti başlatın'
                      }
                    </p>
                  </div>
                ) : (
                  currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAnonymous ? 'justify-center' : ''} ${
                        message.isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isAnonymous 
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                          : message.isOwnMessage 
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                            : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-xs mt-1 opacity-75 ${
                          message.isOwnMessage ? 'text-right' : ''
                        }`}>
                          {message.timestamp.toLocaleDateString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <div className="flex gap-2">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={selectedConversation.isAnonymous 
                      ? "Anonim mesaj yazın..." 
                      : "Mesaj yazın..."
                    }
                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:border-purple-500 focus:outline-none"
                    rows={1}
                    maxLength={selectedConversation.isAnonymous ? 100 : 1000}
                    disabled={sendingMessage}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessageToConversation();
                      }
                    }}
                  />
                  <NeonButton
                    onClick={sendMessageToConversation}
                    disabled={!messageInput.trim() || sendingMessage}
                    variant="primary"
                    size="sm"
                    className="w-12 h-12 flex items-center justify-center"
                  >
                    {sendingMessage ? '...' : '➤'}
                  </NeonButton>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {messageInput.length}/{selectedConversation.isAnonymous ? 100 : 1000}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'inbox' ? 'Gelen Kutusu' : 'Anonim Mesajlar'}
                </h3>
                <p className="opacity-75">Bir sohbet seçin veya profil sayfalarından mesaj gönderin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
