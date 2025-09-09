// src/app/auth/register/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Eğer zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-lg mx-auto">
        <AnimatedCard direction="scale" delay={0}>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black glow-text font-orbitron mb-4 float
                           bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              HOYN!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Hesap Türünü Seç
            </p>
            <p className="text-purple-300 text-sm">
              Hangi tür hesap oluşturmak istiyorsun?
            </p>
          </div>
        </AnimatedCard>

        <div className="space-y-6">
          <AnimatedCard direction="left" delay={200} magnetic hover3d>
            <div
              onClick={() => router.push('/auth/register/personal')}
              className="glass-effect p-6 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl float group-hover:scale-110 transition-transform">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:glow-text transition-all">
                    Bireysel Hesap
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Kişisel profil, sosyal medya bağlantıları ve anonim soru alma özelliği
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                      Profil QR
                    </span>
                    <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                      Anonim Mesaj
                    </span>
                    <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                      Sosyal Medya
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="right" delay={300} magnetic hover3d>
            <div
              onClick={() => router.push('/auth/register/business')}
              className="glass-effect p-6 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl float group-hover:scale-110 transition-transform">
                  🏢
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:glow-text transition-all">
                    İşletme Hesabı
                  </h3>
                  <p className="text-gray-300 mb-3">
                    QR menü, çalışan kartları, müşteri etkileşimi ve işletme yönetimi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                      QR Menü
                    </span>
                    <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                      Çalışan Kartları
                    </span>
                    <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                      İstatistikler
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>

        <AnimatedCard direction="up" delay={400}>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-400">
              Zaten hesabın var mı?{' '}
              <span
                onClick={() => router.push('/auth/login')}
                className="text-purple-400 hover:text-purple-300 cursor-pointer font-bold transition-colors hover:underline"
              >
                Giriş yap
              </span>
            </p>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}