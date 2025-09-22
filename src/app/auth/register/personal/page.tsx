
// src/app/auth/register/personal/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';

export default function PersonalRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  
  const { user, loading, registerWithEmail, error } = useAuth();
  const router = useRouter();

  // Eğer zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        // Bu kontrolü useAuth hook'u zaten yapıyor ama UI'da anlık geri bildirim için eklenebilir.
        alert("Şifre en az 6 karakter olmalıdır.");
        return;
    }
    try {
      await registerWithEmail(email, password, username, displayName);
      // Başarılı kayıt sonrası hook, kullanıcıyı zaten yönlendirecek veya durumu güncelleyecektir.
      // Yönlendirme useEffect içinde handle ediliyor.
    } catch (err) {
      // Hata mesajı zaten useAuth hook'u tarafından `error` state'ine yazılıyor.
      console.error("Kayıt sırasında hata oluştu:", err);
    }
  };
  
  if (loading && !error) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loading size="lg" text="Hesabın oluşturuluyor..." />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-effect p-8 rounded-xl cyber-border">
        <div className="text-center mb-6">
            <h1 className="text-4xl font-black glow-text font-orbitron bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Bireysel Hesap
            </h1>
            <p className="text-gray-300 mt-2">Topluluğa katılmak için bilgileri doldur.</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Görünen Ad (örn: Ali Veli)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-3 bg-gray-900/50 border border-purple-500/30 rounded-lg focus:border-purple-400 focus:outline-none transition-colors text-white placeholder-gray-400"
            required
          />
          
          <input
            type="text"
            placeholder="Benzersiz Kullanıcı Adı (örn: aliveli99)"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full p-3 bg-gray-900/50 border border-purple-500/30 rounded-lg focus:border-purple-400 focus:outline-none transition-colors text-white placeholder-gray-400"
            required
          />

          <input
            type="email"
            placeholder="E-posta Adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-900/50 border border-purple-500/30 rounded-lg focus:border-purple-400 focus:outline-none transition-colors text-white placeholder-gray-400"
            required
          />

          <input
            type="password"
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-900/50 border border-purple-500/30 rounded-lg focus:border-purple-400 focus:outline-none transition-colors text-white placeholder-gray-400"
            required
          />

          <NeonButton
            type="submit"
            variant="primary"
            size="lg"
            glow
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Hesap Oluşturuluyor...' : '🚀 Kaydı Tamamla'}
          </NeonButton>
        </form>
        
        <p className="text-sm text-gray-400 mt-6 text-center">
          Zaten bir hesabın var mı?{' '}
          <span
            onClick={() => router.push('/auth/login')}
            className="text-purple-400 hover:text-purple-300 cursor-pointer font-bold transition-colors"
          >
            Giriş Yap
          </span>
        </p>
      </div>
    </div>
  );
}
