// src/app/subscription/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import { ThemedCard, ThemedButton, ThemedText, ThemedBadge } from '@/components/ui/ThemedComponents';
import { ThemedProfileWrapper } from '@/components/providers/ThemeProvider';

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    subscription, 
    plans, 
    loading: subscriptionLoading,
    hasActiveSubscription,
    subscribeToPlan,
    cancelSubscription
  } = useSubscription();
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Üyelik bilgileri yükleniyor..." />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleSubscribe = async (planId: string) => {
    setProcessing(planId);
    try {
      const success = await subscribeToPlan(planId);
      if (success) {
        // In a real implementation, this would redirect to a payment processor
        alert(`${planId} planına başarıyla geçiş yapıldı!`);
      } else {
        alert('Plan değişikliği sırasında bir hata oluştu.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Plan değişikliği sırasında bir hata oluştu.');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    
    if (window.confirm('Üyeliğinizi iptal etmek istediğinize emin misiniz?')) {
      setProcessing('cancel');
      try {
        const success = await cancelSubscription();
        if (success) {
          alert('Üyeliğiniz iptal edildi. Mevcut dönemin sonuna kadar hizmeti kullanmaya devam edebilirsiniz.');
        } else {
          alert('İptal işlemi sırasında bir hata oluştu.');
        }
      } catch (error) {
        console.error('Cancellation error:', error);
        alert('İptal işlemi sırasında bir hata oluştu.');
      } finally {
        setProcessing(null);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR');
  };

  const getCurrentPlan = () => {
    if (!subscription) return null;
    return plans.find(plan => plan.id === subscription.planId);
  };

  const currentPlan = getCurrentPlan();

  return (
    <ThemedProfileWrapper>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <ThemedText size="4xl" weight="black" variant="primary" glow className="mb-4">
              🌟 Üyelik Planlarım
            </ThemedText>
            <ThemedText size="xl" variant="default" className="mb-2">
              HOYN! Premium deneyimine yükseltin
            </ThemedText>
            <ThemedText variant="muted">
              Gelişmiş özellikler ve sınırsız erişim için plan seçin
            </ThemedText>
          </div>

          {/* Current Subscription */}
          {subscription && (
            <div className="mb-12">
              <ThemedText size="2xl" weight="bold" className="mb-6">
                📋 Mevcut Üyeliğim
              </ThemedText>
              
              <ThemedCard variant="primary" className="p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <ThemedText size="xl" weight="bold" variant="primary">
                        {currentPlan?.name || 'Bilinmeyen Plan'}
                      </ThemedText>
                      {currentPlan?.isPopular && (
                        <ThemedBadge variant="accent" size="sm">
                          En Popüler
                        </ThemedBadge>
                      )}
                      {currentPlan?.isPremium && (
                        <ThemedBadge variant="secondary" size="sm">
                          Premium
                        </ThemedBadge>
                      )}
                    </div>
                    
                    <ThemedText variant="muted" className="mb-3">
                      {hasActiveSubscription ? 'Aktif üyelik' : 'İptal edilmiş üyelik'}
                    </ThemedText>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <ThemedText variant="muted">
                        Başlangıç: {formatDate(subscription.startDate)}
                      </ThemedText>
                      <ThemedText variant="muted">
                        Bitiş: {formatDate(subscription.endDate)}
                      </ThemedText>
                      {subscription.cancelDate && (
                        <ThemedText variant="muted">
                          İptal: {formatDate(subscription.cancelDate)}
                        </ThemedText>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <ThemedText size="2xl" weight="bold" variant="primary" className="mb-2">
                      {currentPlan?.price ? `${currentPlan.price.toFixed(2)} ₺` : 'Ücretsiz'}
                    </ThemedText>
                    {hasActiveSubscription && subscription.autoRenew && (
                      <ThemedButton
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        disabled={processing === 'cancel'}
                      >
                        {processing === 'cancel' ? 'İptal ediliyor...' : 'Üyeliği İptal Et'}
                      </ThemedButton>
                    )}
                  </div>
                </div>
              </ThemedCard>
            </div>
          )}

          {/* Subscription Plans */}
          <div className="mb-12">
            <ThemedText size="2xl" weight="bold" className="mb-6">
              💎 Planlar
            </ThemedText>
            
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = subscription?.planId === plan.id;
                const isDisabled = processing !== null || (isCurrentPlan && hasActiveSubscription);
                
                return (
                  <ThemedCard 
                    key={plan.id} 
                    variant={plan.isPopular ? 'primary' : plan.isPremium ? 'secondary' : 'default'}
                    glow={plan.isPopular}
                    className="p-6 flex flex-col"
                  >
                    {plan.isPopular && (
                      <div className="text-center mb-4">
                        <ThemedBadge variant="accent" size="sm">
                          En Popüler
                        </ThemedBadge>
                      </div>
                    )}
                    
                    {plan.isPremium && (
                      <div className="text-center mb-4">
                        <ThemedBadge variant="secondary" size="sm">
                          Premium
                        </ThemedBadge>
                      </div>
                    )}
                    
                    <ThemedText size="xl" weight="bold" variant="primary" className="mb-2 text-center">
                      {plan.name}
                    </ThemedText>
                    
                    <ThemedText size="3xl" weight="black" variant="primary" className="mb-4 text-center">
                      {plan.price ? `${plan.price.toFixed(2)} ₺` : 'Ücretsiz'}
                      {plan.price > 0 && (
                        <ThemedText size="base" variant="muted">
                          /ay
                        </ThemedText>
                      )}
                    </ThemedText>
                    
                    <ul className="mb-6 flex-grow">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 mb-2">
                          <span>✓</span>
                          <ThemedText variant="default" size="sm">
                            {feature}
                          </ThemedText>
                        </li>
                      ))}
                      
                      {plan.limitations && (
                        <>
                          <li className="my-3">
                            <ThemedText size="xs" variant="muted" className="text-center block">
                              ---
                            </ThemedText>
                          </li>
                          {plan.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start gap-2 mb-2">
                              <span>✗</span>
                              <ThemedText variant="muted" size="sm">
                                {limitation}
                              </ThemedText>
                            </li>
                          ))}
                        </>
                      )}
                    </ul>
                    
                    <ThemedButton
                      onClick={() => handleSubscribe(plan.id)}
                      variant={isCurrentPlan ? 'outline' : 'primary'}
                      size="lg"
                      disabled={isDisabled}
                      glow={!isCurrentPlan}
                      className="w-full"
                    >
                      {processing === plan.id ? (
                        'İşleniyor...'
                      ) : isCurrentPlan ? (
                        hasActiveSubscription ? 'Mevcut Planınız' : 'Yeniden Abone Ol'
                      ) : (
                        'Bu Planı Seç'
                      )}
                    </ThemedButton>
                  </ThemedCard>
                );
              })}
            </div>
          </div>

          {/* Features Comparison */}
          <div>
            <ThemedText size="2xl" weight="bold" className="mb-6">
              🆚 Özellik Karşılaştırması
            </ThemedText>
            
            <ThemedCard variant="default" className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pb-4">
                        <ThemedText weight="bold">Özellikler</ThemedText>
                      </th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="text-center pb-4">
                          <ThemedText weight="bold">{plan.name}</ThemedText>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3">
                        <ThemedText>Sınırsız QR Kod</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <ThemedText>Gelişmiş İstatistikler</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <ThemedText>Tüm Tema Seçenekleri</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <ThemedText>Özel QR Tasarımı</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <ThemedText>İşletme Profili</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <ThemedText>Takım Yönetimi</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <ThemedText>API Erişimi</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="muted">✗</ThemedText>
                      </td>
                      <td className="text-center py-3">
                        <ThemedText variant="primary">✓</ThemedText>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ThemedCard>
          </div>
        </div>
      </div>
    </ThemedProfileWrapper>
  );
}