// src/app/ask/[username]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function AskPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Message length limit
  const maxLength = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Lütfen bir mesaj yazın');
      return;
    }
    
    if (message.length > maxLength) {
      setError('Mesaj çok uzun. Lütfen kısaltın.');
      return;
    }
    
    // Check if Firebase is initialized
    if (!db) {
      setError('Firebase başlatılmadı. Lütfen daha sonra tekrar deneyin.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Add message to Firestore
      await addDoc(collection(db, 'messages'), {
        to: username,
        message: message.trim(),
        timestamp: serverTimestamp(),
        read: false,
        ip: 'hidden', // Could add IP tracking for spam prevention
      });
      
      setSubmitted(true);
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setMessage('');
    setError('');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <AnimatedCard className="max-w-md w-full text-center">
          <div className="glass-effect p-8 rounded-xl cyber-border">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-black glow-text font-orbitron mb-4">
              Mesaj Gönderildi!
            </h1>
            <p className="text-gray-300 mb-6">
              Anonim mesajın <span className="text-purple-400 font-bold">{username}</span> kullanıcısına ulaştı!
            </p>
            
            <div className="space-y-3">
              <NeonButton
                onClick={resetForm}
                variant="primary"
                size="lg"
                glow
                className="w-full"
              >
                💬 Yeni Mesaj Gönder
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
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <AnimatedCard direction="up" delay={0}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black glow-text font-orbitron mb-4">
              💬 Anonim Mesaj
            </h1>
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 p-4 rounded-lg border border-purple-500/30">
              <p className="text-gray-300 mb-1">
                👤 <span className="text-purple-400 font-bold text-xl">{username}</span> kullanıcısına
              </p>
              <p className="text-sm text-gray-400">
                anonim bir mesaj gönderin
              </p>
            </div>
          </div>
        </AnimatedCard>

        {/* Message Form */}
        <AnimatedCard direction="up" delay={200}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glass-effect p-6 rounded-xl cyber-border">
              <label className="block text-lg font-bold text-purple-300 mb-3">
                Mesajınız
              </label>
              
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError('');
                }}
                placeholder="Buraya anonim mesajınızı yazın..."
                className="w-full h-32 p-4 bg-gray-900/50 border border-purple-500/30 rounded-lg
                           focus:border-purple-400 focus:outline-none transition-colors
                           text-white placeholder-gray-400 resize-none"
                maxLength={maxLength + 50} // Allow a bit more for real-time feedback
              />
              
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm ${
                  message.length > maxLength ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {message.length}/{maxLength}
                </span>
                
                {message.length > maxLength && (
                  <span className="text-red-400 text-sm font-bold">
                    ⚠️ Çok uzun!
                  </span>
                )}
              </div>
            </div>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <NeonButton
                type="submit"
                variant="primary"
                size="lg"
                glow
                disabled={isSubmitting || !message.trim() || message.length > maxLength}
                className="w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                    Gönderiliyor...
                  </span>
                ) : (
                  '🚀 Anonim Mesaj Gönder'
                )}
              </NeonButton>
              
              <NeonButton
                onClick={() => router.push('/')}
                variant="outline"
                size="md"
                className="w-full"
              >
                ← Ana Sayfaya Dön
              </NeonButton>
            </div>
          </form>
        </AnimatedCard>

        {/* Info */}
        <AnimatedCard direction="up" delay={400} className="mt-8">
          <div className="text-center p-4">
            <h4 className="text-lg font-bold text-purple-300 mb-3">🛡️ Güvenlik</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p>🕵️ Kimliğiniz tamamen gizli</p>
              <p>🚫 Spam ve zarar verici içerik yasak</p>
              <p>📝 Mesajlar {username} kullanıcısına iletilir</p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}