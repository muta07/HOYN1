// src/app/auth/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading, loginWithEmail, loginWithGoogle, error } = useAuth();
  const router = useRouter();

  // Eğer zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await loginWithEmail(email, password);
      // useAuth hook otomatik olarak dashboard'a yönlendirecek
    } catch (error: any) {
      // Error useAuth hook'ta handle ediliyor
      console.error('Login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // useAuth hook otomatik olarak dashboard'a yönlendirecek
    } catch (error: any) {
      console.error('Google login error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Giriş yapılıyor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-effect p-8 rounded-xl cyber-border">
        <h1 className="text-4xl font-black glow-text font-orbitron mb-6 text-center
                       bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          HOYN!
        </h1>
        <p className="text-gray-300 mb-6 text-center">Hesabına giriş yap</p>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Email/Şifre Formu */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-900/50 border border-purple-500/30 rounded-lg
                       focus:border-purple-400 focus:outline-none transition-colors
                       text-white placeholder-gray-400"
            required
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-900/50 border border-purple-500/30 rounded-lg
                       focus:border-purple-400 focus:outline-none transition-colors
                       text-white placeholder-gray-400"
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
            {loading ? 'Giriş Yapılıyor...' : '🚀 Giriş Yap'}
          </NeonButton>
        </form>

        {/* Google ile Giriş */}
        <div className="mt-6">
          <NeonButton
            onClick={handleGoogleLogin}
            variant="outline"
            size="lg"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google ile Giriş
          </NeonButton>
        </div>

        {/* Kaydol Linki */}
        <p className="text-sm text-gray-400 mt-6 text-center">
          Hesabın yok mu?{' '}
          <span
            onClick={() => router.push('/auth/register')}
            className="text-purple-400 hover:text-purple-300 cursor-pointer font-bold transition-colors"
          >
            Kaydol
          </span>
        </p>
      </div>
    </div>
  );
}