// src/components/ui/MessagesPanel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import NeonButton from './NeonButton';
import Loading from './Loading';

interface Message {
  id: string;
  message: string;
  from?: string;
  to: string;
  timestamp: any;
  read: boolean;
}

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessagesPanel({ isOpen, onClose }: MessagesPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get current username
  const username = user?.displayName || 
    (user?.email ? user.email.split('@')[0] : 'kullanici');

  // Load messages when panel opens
  useEffect(() => {
    if (!user || !username || !isOpen) return;

    // Check if Firebase is initialized
    if (!db) {
      console.warn('Firebase is not initialized. Cannot load messages.');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'messages'),
      where('to', '==', username),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      let unread = 0;
      
      snapshot.forEach((doc) => {
        const messageData = doc.data() as Omit<Message, 'id'>;
        const message: Message = {
          id: doc.id,
          ...messageData
        };
        messageList.push(message);
        
        if (!message.read) {
          unread++;
        }
      });
      
      setMessages(messageList);
      setUnreadCount(unread);
      setLoading(false);
    }, (error) => {
      console.error('Messages loading error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, username, isOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    // Check if Firebase is initialized
    if (!db) {
      console.warn('Firebase is not initialized. Cannot mark message as read.');
      return;
    }

    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Send reply message
  const sendReply = async () => {
    if (!newMessage.trim() || !replyTo || !user) return;

    // Check if Firebase is initialized
    if (!db) {
      console.warn('Firebase is not initialized. Cannot send reply.');
      return;
    }

    try {
      await addDoc(collection(db, 'messages'), {
        message: newMessage.trim(),
        from: username,
        to: replyTo,
        timestamp: serverTimestamp(),
        read: false
      });

      setNewMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Mesaj gönderilemedi: ' + (error as Error).message);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Şimdi';
    if (diffMinutes < 60) return `${diffMinutes}dk`;
    if (diffHours < 24) return `${diffHours}sa`;
    if (diffDays < 7) return `${diffDays}g`;
    
    return date.toLocaleDateString('tr-TR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div 
        ref={panelRef}
        className="fixed right-0 top-16 bottom-0 w-full max-w-md bg-gray-900 border-l border-purple-900/50 shadow-2xl transform transition-transform duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-900/50 bg-purple-900/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>💬</span>
            Mesajlar
            {unreadCount > 0 && (
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Mesaj panelini kapat"
          >
            ✕
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="sm" text="Mesajlar yükleniyor..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <p className="text-gray-400 text-sm">Henüz mesajın yok</p>
              <p className="text-gray-500 text-xs mt-2">
                QR kodunu paylaş, anonim mesajlar al!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  message.read 
                    ? 'bg-gray-800/50 border-gray-600' 
                    : 'bg-purple-900/20 border-purple-500/30 glow-subtle'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {message.from ? (
                        <span className="text-purple-300 font-medium">@{message.from}</span>
                      ) : (
                        <span className="text-gray-400 italic">Anonim</span>
                      )}
                    </span>
                    {!message.read && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                
                <p className="text-white text-sm mb-3 break-words">
                  {message.message}
                </p>
                
                <div className="flex gap-2">
                  {!message.read && (
                    <button
                      onClick={() => markAsRead(message.id)}
                      className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      ✓ Okundu
                    </button>
                  )}
                  {message.from && (
                    <button
                      onClick={() => setReplyTo(message.from!)}
                      className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                    >
                      ↩ Yanıtla
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Form */}
        {replyTo && (
          <div className="border-t border-purple-900/50 p-4 bg-purple-900/10">
            <div className="mb-2">
              <span className="text-xs text-purple-300">
                @{replyTo} kullanıcısına yanıt:
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-white ml-2 text-xs"
              >
                ✕ İptal
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                placeholder="Yanıt yaz..."
                className="flex-1 p-2 text-sm bg-gray-800 border border-gray-600 rounded text-white focus:border-purple-500 focus:outline-none"
                maxLength={500}
              />
              <NeonButton
                onClick={sendReply}
                disabled={!newMessage.trim()}
                variant="primary"
                size="sm"
              >
                Gönder
              </NeonButton>
            </div>
          </div>
        )}

        {/* Footer Links */}
        <div className="border-t border-purple-900/50 p-4 bg-gray-900/50">
          <div className="flex justify-between items-center">
            <NeonButton
              onClick={() => window.open('/dashboard/messages', '_blank')}
              variant="outline"
              size="sm"
            >
              📋 Tüm Mesajlar
            </NeonButton>
            <NeonButton
              onClick={() => window.open(`/ask/${username}`, '_blank')}
              variant="secondary"
              size="sm"
            >
              🔗 Mesaj Linki
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}