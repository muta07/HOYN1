'use client';

import { Conversation } from '@/lib/firebase';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId: string | null;
}

export default function ConversationList({ 
  conversations, 
  currentUserId, 
  onSelectConversation,
  selectedConversationId
}: ConversationListProps) {
  const getDisplayName = (conversation: Conversation) => {
    if (conversation.isAnonymousThread) {
      return 'Anonim';
    }
    
    // Find the other participant
    const otherParticipant = conversation.participants.find(id => id !== currentUserId);
    return otherParticipant ? otherParticipant : 'Bilinmeyen Kullanıcı';
  };

  const getAvatarUrl = (conversation: Conversation) => {
    return '/api/placeholder/40/40';
  };

  return (
    <div className="space-y-0">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg">Henüz mesajınız yok</p>
          <p className="text-sm opacity-75">
            Profil sayfalarından mesaj gönderebilirsiniz
          </p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors ${
              selectedConversationId === conversation.id 
                ? 'bg-purple-900/20 border-l-4 border-purple-500' 
                : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <img 
                    src={getAvatarUrl(conversation)} 
                    alt={getDisplayName(conversation)}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-white truncate">
                      {getDisplayName(conversation)}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {conversation.isAnonymousThread ? 'Anonim' : conversation.participants.length + ' katılımcı'}
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
                {conversation.unreadCounts?.[currentUserId] > 0 && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {conversation.unreadCounts[currentUserId] > 9 ? '9+' : conversation.unreadCounts[currentUserId]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}