'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/firebase';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onMessageRead?: (messageId: string) => void;
}

export default function MessageList({ messages, currentUserId, onMessageRead }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they are displayed
  useEffect(() => {
    messages.forEach(message => {
      if (message.recipientId === currentUserId && !message.isRead && !readMessages.has(message.id)) {
        onMessageRead?.(message.id);
        setReadMessages(prev => new Set(prev).add(message.id));
      }
    });
  }, [messages, currentUserId, onMessageRead, readMessages]);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Şimdi';
    if (diffMinutes < 60) return `${diffMinutes} dk`;
    if (diffHours < 24) return `${diffHours} sa`;
    if (diffDays < 7) return `${diffDays} gün`;
    
    return messageTime.toLocaleDateString('tr-TR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">💬</div>
          <p>Henüz mesaj yok</p>
          <p className="text-sm opacity-75 mt-2">
            İlk mesajı göndererek sohbeti başlatın
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;
          const isAnonymous = message.senderId === null;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isAnonymous 
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                  : isOwnMessage 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-gray-700/50 text-gray-300 border border-gray-600'
              }`}>
                {!isAnonymous && !isOwnMessage && (
                  <div className="font-semibold text-sm mb-1">
                    {message.senderName}
                  </div>
                )}
                {isAnonymous && (
                  <div className="font-semibold text-sm mb-1 text-purple-400">
                    Anonim
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 opacity-75 ${
                  isOwnMessage ? 'text-right' : ''
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}