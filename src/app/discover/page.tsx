// src/app/discover/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function DiscoverPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Keşfet sayfası yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <AnimatedCard direction="scale" delay={0}>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black glow-text font-orbitron mb-4 float
                           bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🔍 Keşfet
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              HOYN! topluluğunu keşfet ve yeni insanlarla tanış
            </p>
            <p className="text-purple-300">
              Yakında aktif olacak özellikler 🚀
            </p>
          </div>
        </AnimatedCard>

        {/* Coming Soon Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <AnimatedCard direction="left" delay={200}>
            <div className="glass-effect p-8 rounded-xl cyber-border opacity-75">
              <div className="text-6xl mb-4 float">🌟</div>
              <h2 className="text-3xl font-bold text-white mb-4 glow-text">
                Popüler Profiller
              </h2>
              <p className="text-gray-300 mb-6">
                En çok takip edilen ve etkileşim alan profilleri keşfet.
              </p>
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 font-bold">🚧 Yakında</p>
                <p className="text-xs text-gray-400 mt-1">Phase 6'da aktif olacak</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="right" delay={300}>
            <div className="glass-effect p-8 rounded-xl cyber-border opacity-75">
              <div className="text-6xl mb-4 float">🏷️</div>
              <h2 className="text-3xl font-bold text-white mb-4 glow-text">
                Trending QR'lar
              </h2>
              <p className="text-gray-300 mb-6">
                Bu hafta en popüler QR kodları ve tasarımları.
              </p>
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 font-bold">🚧 Yakında</p>
                <p className="text-xs text-gray-400 mt-1">Phase 4-5'te aktif olacak</p>
              </div>
            </div>
          </AnimatedCard>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <AnimatedCard direction="left" delay={400}>
            <div className="glass-effect p-8 rounded-xl cyber-border opacity-75">
              <div className="text-6xl mb-4 float">🎨</div>
              <h2 className="text-3xl font-bold text-white mb-4 glow-text">
                Tasarım Galeris
              </h2>
              <p className="text-gray-300 mb-6">
                Topluluk tarafından oluşturulan en yaratıcı QR tasarımları.
              </p>
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 font-bold">🚧 Yakında</p>
                <p className="text-xs text-gray-400 mt-1">Phase 3-4'te aktif olacak</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard direction="right" delay={500}>
            <div className="glass-effect p-8 rounded-xl cyber-border opacity-75">
              <div className="text-6xl mb-4 float">🏢</div>
              <h2 className="text-3xl font-bold text-white mb-4 glow-text">
                İşletmeler
              </h2>
              <p className="text-gray-300 mb-6">
                HOYN! kullanan işletmeleri keşfet ve onlarla iletişime geç.
              </p>
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 font-bold">🚧 Yakında</p>
                <p className="text-xs text-gray-400 mt-1">Phase 5'te aktif olacak</p>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Quick Actions */}
        <AnimatedCard direction="up" delay={600}>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-6 glow-text">
              🚀 Şimdilik Bunları Deneyebilirsin
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <NeonButton
                onClick={() => router.push('/dashboard/qr-generator')}
                variant="primary"
                size="lg"
                glow
              >
                ✨ QR Oluştur
              </NeonButton>
              <NeonButton
                onClick={() => router.push('/scan')}
                variant="secondary"
                size="lg"
              >
                📱 QR Tara
              </NeonButton>
              <NeonButton
                onClick={() => router.push('/designer')}
                variant="outline"
                size="lg"
              >
                👕 Tasarla
              </NeonButton>
            </div>
          </div>
        </AnimatedCard>

        {/* Development Info */}
        <AnimatedCard direction="up" delay={700} className="mt-12">
          <div className="glass-effect p-6 rounded-xl cyber-border bg-gray-900/50">
            <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
              <span>💡</span>
              Geliştirme Notları
            </h4>
            <div className="text-sm text-gray-400 space-y-2">
              <p>• <strong>Phase 0-1:</strong> ✅ QR altyapısı ve tarayıcı tamamlandı</p>
              <p>• <strong>Phase 2:</strong> 🚧 Profil layout ve istatistikler (şu an)</p>
              <p>• <strong>Phase 3:</strong> ⏳ Tasarım studio ve mockup yükleme</p>
              <p>• <strong>Phase 4:</strong> ⏳ QR modları (müzik, not, profil)</p>
              <p>• <strong>Phase 5:</strong> ⏳ İşletme özellikleri</p>
              <p>• <strong>Phase 6:</strong> ⏳ Sosyal özellikler ve analytics</p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}