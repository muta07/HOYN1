// src/app/dashboard/messages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface Message {
  id: string;
  message: string;
  timestamp: any;
  read: boolean;
  to: string;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  // Get current username
  const username = user?.displayName || 
    (user?.email ? user.email.split('@')[0] : 'kullanici');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !username) return;

    const q = query(
      collection(db, 'messages'),
      where('to', '==', username),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        messageList.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(messageList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, username]);

  const markAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const filteredMessages = messages.filter(msg => 
    filter === 'all' ? true : !msg.read
  );

  const unreadCount = messages.filter(msg => !msg.read).length;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Yeni';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600);
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} saat önce`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Mesajlar yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <AnimatedCard direction="up" delay={0}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black glow-text font-orbitron mb-4">
              📬 Mesaj Kutusu
            </h1>
            <p className="text-gray-300">
              Sana gelen anonim mesajlar burada görünür
            </p>
            {unreadCount > 0 && (
              <div className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold mt-2">
                {unreadCount} okunmamış mesaj
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Filter Buttons */}
        <AnimatedCard direction="up" delay={100} className="mb-6">
          <div className="flex justify-center gap-4">
            <NeonButton
              onClick={() => setFilter('unread')}
              variant={filter === 'unread' ? 'primary' : 'outline'}
              size="md"
            >
              Okunmamışlar ({unreadCount})
            </NeonButton>
            <NeonButton
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="md"
            >
              Tümü ({messages.length})
            </NeonButton>
          </div>
        </AnimatedCard>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <AnimatedCard direction="up" delay={200}>
            <div className="glass-effect p-12 rounded-xl cyber-border text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {filter === 'unread' ? 'Okunmamış mesaj yok' : 'Henüz mesaj yok'}
              </h3>
              <p className="text-gray-400 mb-6">
                QR kodunu paylaş, insanlar sana anonim mesaj göndersin!
              </p>
              <NeonButton
                onClick={() => router.push('/dashboard/qr-generator')}
                variant="primary"
                size="lg"
                glow
              >
                ✨ QR Kodunu Oluştur
              </NeonButton>
            </div>
          </AnimatedCard>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message, index) => (
              <AnimatedCard 
                key={message.id} 
                direction="up" 
                delay={200 + (index * 100)}
              >
                <div className={`glass-effect p-6 rounded-xl cyber-border transition-all ${
                  !message.read ? 'border-purple-500 glow-subtle' : 'border-gray-700'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🕵️</div>
                      <div>
                        <h3 className="font-bold text-white">Anonim Mesaj</h3>
                        <p className="text-sm text-gray-400">
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!message.read && (
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                          YENİ
                        </span>
                      )}
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Mesajı Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
                    <p className="text-white leading-relaxed">
                      {message.message}
                    </p>
                  </div>
                  
                  {!message.read && (
                    <div className="flex justify-end">
                      <NeonButton
                        onClick={() => markAsRead(message.id)}
                        variant="outline"
                        size="sm"
                      >
                        ✅ Okundu İşaretle
                      </NeonButton>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* Back Button */}
        <AnimatedCard direction="up" delay={400} className="mt-8">
          <div className="text-center">
            <NeonButton
              onClick={() => router.push('/dashboard')}
              variant="secondary"
              size="lg"
              className="min-w-[200px]"
            >
              ← Dashboard'a Dön
            </NeonButton>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}