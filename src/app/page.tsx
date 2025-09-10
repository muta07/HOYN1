// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function Home() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Home page: useEffect triggered', { user, loading, error });
    if (user) {
      console.log('Home page: User detected, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, router]);

  console.log('Home page: Rendering', { user, loading, error });

  if (loading) {
    console.log('Home page: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="HOYN! Yükleniyor..." />
      </div>
    );
  }

  // Hata durumunda kullanıcıya bilgi ver
  if (error) {
    console.log('Home page: Showing error state', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="glass-effect p-8 rounded-xl cyber-border text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Bir Hata Oluştu</h2>
          <p className="text-gray-300 mb-6">Üzgünüz, uygulamada bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          <p className="text-sm text-gray-500 mb-6">Hata detayı: {error}</p>
          <NeonButton 
            onClick={() => window.location.reload()} 
            variant="primary"
            size="md"
          >
            Sayfayı Yenile
          </NeonButton>
        </div>
      </div>
    );
  }

  console.log('Home page: Showing main content');

  return (
    <div className="min-h-screen pt-24 px-6">
      {/* Hero Section */}
      <AnimatedCard direction="scale" delay={0}>
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-8xl font-black glow-text font-orbitron mb-4 float
                           bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              HOYN!
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-purple-700 mx-auto rounded-full glow-intense" />
          </div>
          
          <p className="text-2xl text-gray-300 mb-4 max-w-3xl mx-auto font-light">
            QR kodunla tanış, tişörtüne bas, dünyaya göster.
          </p>
          <p className="text-lg text-purple-300 mb-12 max-w-2xl mx-auto">
            Fiziksel dünyada dijital kimliğini taşı. Anonim mesajlar al, QR kodunu her yere bas!
          </p>

          <AnimatedCard direction="up" delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <NeonButton
                onClick={() => router.push('/auth/register')}
                variant="primary"
                size="lg"
                glow
                ripple
                className="min-w-[200px]"
              >
                🚀 Başla Şimdi
              </NeonButton>
              <NeonButton
                onClick={() => router.push('/auth/login')}
                variant="outline"
                size="lg"
                ripple
                className="min-w-[200px]"
              >
                Giriş Yap
              </NeonButton>
            </div>

          </AnimatedCard>
        </div>
      </AnimatedCard>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto mb-16">
        <AnimatedCard direction="up" delay={600}>
          <h2 className="text-4xl font-bold text-center mb-12 glow-text">
            Neler Yapabilirsin?
          </h2>
        </AnimatedCard>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatedCard direction="left" delay={800} magnetic hover3d>
            <div className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group">
              <div className="text-6xl mb-4 float">🚗</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4 group-hover:glow-text transition-all">
                Araban mı Var?
              </h3>
              <p className="text-gray-300">
                QR'ını camına yapıştır. Sigorta, muayene, satılık ilanı — her şey tek tıkta.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="up" delay={900} magnetic hover3d>
            <div className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group">
              <div className="text-6xl mb-4 float">🐱</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4 group-hover:glow-text transition-all">
                Evcil Hayvanın mı Var?
              </h3>
              <p className="text-gray-300">
                Kolyesine QR koy. Kaybolursa, sahibine ulaşmak kolay.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="right" delay={1000} magnetic hover3d>
            <div className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group">
              <div className="text-6xl mb-4 float">👕</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4 group-hover:glow-text transition-all">
                Tişört Tasarla
              </h3>
              <p className="text-gray-300">
                QR kodunu tişört, hoodie, sticker'a yerleştir. Printify tarzı tasarla!
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="left" delay={1100} magnetic hover3d>
            <div className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group">
              <div className="text-6xl mb-4 float">❓</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4 group-hover:glow-text transition-all">
                Anonim Mesajlar
              </h3>
              <p className="text-gray-300">
                QR'ini tarayan kişiler sana anonim soru gönderebilir.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="up" delay={1200} magnetic hover3d>
            <div className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group">
              <div className="text-6xl mb-4 float">📱</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4 group-hover:glow-text transition-all">
                Mobil Tarayıcı
              </h3>
              <p className="text-gray-300">
                Uygulama içi QR tarayıcı ile başkalarının kodlarını okut.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="right" delay={1300} magnetic hover3d>
            <div className="glass-effect p-8 rounded-xl cyber-border hover:glow-intense transition-all duration-300 group">
              <div className="text-6xl mb-4 float">📈</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4 group-hover:glow-text transition-all">
                İstatistikler
              </h3>
              <p className="text-gray-300">
                QR kodun kaç kez tarandı, kaç mesaj geldi? Hepsini gör!
              </p>
            </div>
          </AnimatedCard>
        </div>
      </div>

      {/* CTA Section */}
      <AnimatedCard direction="scale" delay={1400}>
        <div className="text-center mb-16">
          <div className="glass-effect p-12 rounded-2xl cyber-border max-w-4xl mx-auto hover:glow-intense transition-all duration-500">
            <h2 className="text-4xl font-bold glow-text mb-6">
              HOYN! Artık Sadece Bir Fikir Değil
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Bir <span className="text-purple-400 font-bold">lifestyle</span>. 💫
            </p>
            <NeonButton
              onClick={() => router.push('/auth/register')}
              variant="primary"
              size="lg"
              glow
              ripple
              className="text-xl px-12 py-4"
            >
              🚀 Hemen Başla - Ücretsiz!
            </NeonButton>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}