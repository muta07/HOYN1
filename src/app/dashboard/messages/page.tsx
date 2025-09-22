
// src/app/dashboard/messages/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

// API'den gelen mesaj formatı
interface Message {
  id: string;
  content: string;
  senderDisplayName: string;
  isAnonymous: boolean;
  isRead: boolean;
  timestamp: string; // ISO string formatı
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Mesajlar alınamadı.');
      }

      const data: Message[] = await response.json();
      setMessages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
        if (user) {
            fetchMessages();
        } else {
            router.push('/auth/login');
        }
    }
  }, [user, authLoading, router, fetchMessages]);

  // TODO: Bu fonksiyonlar da API'ye taşınmalı (PATCH /api/messages/:id, DELETE /api/messages/:id)
  const markAsRead = async (messageId: string) => {
    alert('Bu özellik yakında API üzerinden çalışacak.');
    // Geçici olarak client-side güncelleme
    setMessages(msgs => msgs.map(m => m.id === messageId ? { ...m, isRead: true } : m));
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    alert('Bu özellik yakında API üzerinden çalışacak.');
    // Geçici olarak client-side silme
    setMessages(msgs => msgs.filter(m => m.id !== messageId));
  };

  const filteredMessages = messages.filter(msg => 
    filter === 'all' ? true : !msg.isRead
  );

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600);
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} saat önce`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loading size="lg" text="Mesajlar yükleniyor..." /></div>;
  }

  if (error) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-red-400">Hata: {error}</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <AnimatedCard direction="up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black glow-text font-orbitron mb-4">📬 Mesaj Kutusu</h1>
            <p className="text-gray-300">Sana gelen mesajlar burada görünür.</p>
            {unreadCount > 0 && <div className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold mt-2">{unreadCount} okunmamış mesaj</div>}
          </div>
        </AnimatedCard>

        <AnimatedCard direction="up" delay={100} className="mb-6">
          <div className="flex justify-center gap-4">
            <NeonButton onClick={() => setFilter('unread')} variant={filter === 'unread' ? 'primary' : 'outline'}>Okunmamışlar ({unreadCount})</NeonButton>
            <NeonButton onClick={() => setFilter('all')} variant={filter === 'all' ? 'primary' : 'outline'}>Tümü ({messages.length})</NeonButton>
          </div>
        </AnimatedCard>

        {filteredMessages.length === 0 ? (
          <AnimatedCard direction="up" delay={200}>
            <div className="glass-effect p-12 rounded-xl cyber-border text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-white mb-2">{filter === 'unread' ? 'Okunmamış mesaj yok' : 'Henüz mesaj yok'}</h3>
              <p className="text-gray-400 mb-6">Profilini paylaş, insanlar sana mesaj göndersin!</p>
              <NeonButton onClick={() => router.push('/u/' + (user.email?.split('@')[0] || ''))} variant="primary" size="lg" glow>Profilini Görüntüle</NeonButton>
            </div>
          </AnimatedCard>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message, index) => (
              <AnimatedCard key={message.id} direction="up" delay={200 + (index * 100)}>
                <div className={`glass-effect p-6 rounded-xl cyber-border transition-all ${!message.isRead ? 'border-purple-500' : 'border-gray-700'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{message.isAnonymous ? '🕵️' : '👤'}</div>
                      <div>
                        <h3 className="font-bold text-white">{message.senderDisplayName}</h3>
                        <p className="text-sm text-gray-400">{formatDate(message.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!message.isRead && <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">YENİ</span>}
                      <button onClick={() => deleteMessage(message.id)} className="text-red-400 hover:text-red-300" title="Mesajı Sil">🗑️</button>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
                    <p className="text-white leading-relaxed">{message.content}</p>
                  </div>
                  {!message.isRead && (
                    <div className="flex justify-end">
                      <NeonButton onClick={() => markAsRead(message.id)} variant="outline" size="sm">✅ Okundu İşaretle</NeonButton>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
