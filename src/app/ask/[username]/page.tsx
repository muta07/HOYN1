
// src/app/ask/[username]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Auth hook'unu ekliyoruz
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function AskPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Giriş yapmış kullanıcıyı kontrol et
  const username = params.username as string;
  
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const maxLength = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
        setError('Mesaj göndermek için giriş yapmalısınız.');
        return;
    }
    if (!message.trim()) {
      setError('Mesaj boş olamaz!');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // API'ye POST isteği gönder
      const idToken = await user.getIdToken();
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          recipientUsername: username,
          content: message.trim(),
          isAnonymous: true, // Bu form her zaman anonim mesaj gönderir
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Bir hata oluştu.');
      }
      
      setSubmitted(true);
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(`Mesaj gönderilemedi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setMessage('');
    setError('');
  };

  if (authLoading) {
      return <div className="min-h-screen bg-black flex items-center justify-center"><Loading text="Yükleniyor..."/></div>
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <AnimatedCard className="max-w-md w-full text-center">
          <div className="glass-effect p-8 rounded-xl cyber-border">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-black glow-text font-orbitron mb-4">Mesaj Gönderildi!</h1>
            <p className="text-gray-300 mb-6">Anonim mesajın <span className="text-purple-400 font-bold">{username}</span> kullanıcısına ulaştı!</p>
            <div className="space-y-3">
              <NeonButton onClick={resetForm} variant="primary" size="lg" glow className="w-full">💬 Yeni Mesaj Gönder</NeonButton>
              <NeonButton onClick={() => router.push('/')} variant="outline" size="md" className="w-full">🏠 Ana Sayfaya Dön</NeonButton>
            </div>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        <AnimatedCard direction="up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black glow-text font-orbitron mb-4">💬 Anonim Mesaj</h1>
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-4 rounded-lg border border-purple-500/30">
              <p className="text-gray-300 mb-1">👤 <span className="text-purple-400 font-bold text-xl">{username}</span> kullanıcısına</p>
              <p className="text-sm text-gray-400">anonim bir mesaj gönderin</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard direction="up" delay={200}>
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass-effect p-6 rounded-xl cyber-border">
                <label className="block text-lg font-bold text-purple-300 mb-3">Mesajınız</label>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setError(''); }}
                  placeholder="Buraya anonim mesajınızı yazın..."
                  className="w-full h-32 p-4 bg-gray-900/50 border border-purple-500/30 rounded-lg focus:border-purple-400 focus:outline-none transition-colors text-white placeholder-gray-400 resize-none"
                  maxLength={maxLength}
                />
                <div className="text-right text-sm text-gray-400 mt-2">{message.length}/{maxLength}</div>
              </div>
              {error && <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-center">{error}</div>}
              <NeonButton type="submit" variant="primary" size="lg" glow disabled={isSubmitting || !message.trim()} className="w-full">
                {isSubmitting ? 'Gönderiliyor...' : '🚀 Anonim Mesaj Gönder'}
              </NeonButton>
            </form>
          ) : (
            <div className="glass-effect p-8 rounded-xl cyber-border text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-white mb-3">Giriş Gerekli</h2>
                <p className="text-gray-300 mb-6">Anonim mesaj gönderebilmek için bir hesabınızın olması ve giriş yapmanız gerekmektedir. Kimliğiniz alıcıya gösterilmeyecektir.</p>
                <NeonButton onClick={() => router.push('/auth/login?returnUrl=/ask/' + username)} variant="primary" size="lg" glow className="w-full">Giriş Yap</NeonButton>
                <p className="text-xs text-gray-400 mt-4">Hesabın yok mu? <span onClick={() => router.push('/auth/register')} className="text-purple-400 hover:underline cursor-pointer">Kaydol</span></p>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  );
}
