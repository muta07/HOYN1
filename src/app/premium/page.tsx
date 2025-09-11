// src/app/premium/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import Loading from '@/components/ui/Loading';
import { ThemedCard, ThemedButton, ThemedText, ThemedBadge } from '@/components/ui/ThemedComponents';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';
import AnalyticsDashboard from '@/components/premium/AnalyticsDashboard';
import AdvancedQRDesigner from '@/components/premium/AdvancedQRDesigner';

export default function PremiumDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'designer'>('analytics');

  useEffect(() => {
    setIsClient(true);
    
    // Client-side'da subscription verisini yükle
    if (typeof window !== 'undefined') {
      const loadSubscription = async () => {
        try {
          const { useSubscription } = await import('@/components/providers/SubscriptionProvider');
          // Bu noktada doğrudan hook'u çağıramayız, bu yüzden context'i manuel olarak kontrol edeceğiz
          setSubscriptionLoading(false);
        } catch (error) {
          console.error('Error loading subscription:', error);
          setSubscriptionLoading(false);
        }
      };
      
      loadSubscription();
    }
  }, []);

  if (!isClient || authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Premium panel yükleniyor..." />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Check if user has premium access (basit bir kontrol)
  const hasPremiumAccess = false; // Varsayılan olarak false, gerçek kontrol client-side yapılmalı

  if (!hasPremiumAccess) {
    return (
      <ThemedProfileWrapper>
        <div className="min-h-screen py-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🔒</div>
            <ThemedText size="4xl" weight="black" variant="primary" glow className="mb-4">
              Premium Özellikler
            </ThemedText>
            <ThemedText size="xl" variant="default" className="mb-8">
              Gelişmiş analizler, özel QR tasarımı ve daha fazlası için premium üyeliğe yükseltin
            </ThemedText>
            
            <ThemedCard variant="primary" className="p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <ThemedText size="2xl" weight="bold" className="mb-4">
                    Pro Plan
                  </ThemedText>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>Sınırsız QR Kod</ThemedText>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>Gelişmiş İstatistikler</ThemedText>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>Özel QR Tasarımı</ThemedText>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>Günlük Analiz Raporları</ThemedText>
                    </li>
                  </ul>
                  <ThemedText size="2xl" weight="bold" variant="primary">
                    9,99 ₺<ThemedText size="base">/ay</ThemedText>
                  </ThemedText>
                </div>
                
                <div>
                  <ThemedText size="2xl" weight="bold" className="mb-4">
                    Business Plan
                  </ThemedText>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>Tüm Pro Özellikleri</ThemedText>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>İşletme Profili</ThemedText>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>Takım Yönetimi</ThemedText>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <ThemedText>API Erişimi</ThemedText>
                    </li>
                  </ul>
                  <ThemedText size="2xl" weight="bold" variant="primary">
                    29,99 ₺<ThemedText size="base">/ay</ThemedText>
                  </ThemedText>
                </div>
              </div>
              
              <div className="mt-8">
                <ThemedButton
                  onClick={() => router.push('/subscription')}
                  variant="primary"
                  size="lg"
                  glow
                >
                  Premium Ol
                </ThemedButton>
              </div>
            </ThemedCard>
            
            <ThemedButton
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="md"
            >
              ← Panele Dön
            </ThemedButton>
          </div>
        </div>
      </ThemedProfileWrapper>
    );
  }

  return (
    <ThemedProfileWrapper>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <ThemedText size="4xl" weight="black" variant="primary" glow className="mb-4">
              🌟 Premium Panel
            </ThemedText>
            <ThemedText size="xl" variant="default">
              Gelişmiş özelliklerin keyfini çıkarın
            </ThemedText>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <ThemedButton
              onClick={() => setActiveTab('analytics')}
              variant={activeTab === 'analytics' ? 'primary' : 'outline'}
              size="md"
            >
              📊 Analizler
            </ThemedButton>
            <ThemedButton
              onClick={() => setActiveTab('designer')}
              variant={activeTab === 'designer' ? 'primary' : 'outline'}
              size="md"
            >
              🎨 QR Tasarımcı
            </ThemedButton>
          </div>

          {/* Content */}
          {activeTab === 'analytics' ? (
            <AnalyticsDashboard />
          ) : (
            <AdvancedQRDesigner onDesignChange={(design) => console.log('Design updated:', design)} />
          )}
        </div>
      </div>
    </ThemedProfileWrapper>
  );
}