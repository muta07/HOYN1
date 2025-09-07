// src/lib/subscriptions.ts
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  limitations?: string[];
  isPopular?: boolean;
  isPremium?: boolean;
}

export interface UserSubscription {
  id?: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  cancelDate?: Date;
  paymentMethod?: string;
  autoRenew: boolean;
}

// Subscription plans
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    period: 'monthly',
    features: [
      '5 QR Kod oluştur',
      'Temel istatistikler',
      'Standart profil özelleştirme',
      'E-mail desteği'
    ],
    limitations: [
      'Günlük QR oluşturma limiti: 5',
      'Temel analizler',
      'Sınırlı tema seçenekleri'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    period: 'monthly',
    features: [
      'Sınırsız QR Kod oluştur',
      'Gelişmiş istatistikler',
      'Tüm profil temaları',
      'Öncelikli e-mail desteği',
      'Özel QR tasarımı',
      'Not ve şarkı modları',
      'Günlük analiz raporları'
    ],
    isPopular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 29.99,
    period: 'monthly',
    features: [
      'Sınırsız QR Kod oluştur',
      'Tüm Pro özellikler',
      'İşletme profili',
      'Takım yönetimi (5 kullanıcı)',
      'Detaylı analiz panosu',
      'Öncelikli destek',
      'API erişimi',
      'Özel alan adı',
      'Haftalık raporlar'
    ],
    isPremium: true
  }
];

// Get all subscription plans
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return subscriptionPlans;
}

// Get a specific subscription plan by ID
export function getSubscriptionPlanById(id: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find(plan => plan.id === id);
}

// Check if user has active subscription
export function hasActiveSubscription(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  
  const now = new Date();
  return subscription.status === 'active' && 
         subscription.endDate > now && 
         (!subscription.cancelDate || subscription.cancelDate > now);
}

// Check if user is on a specific plan
export function isOnPlan(subscription: UserSubscription | null, planId: string): boolean {
  if (!subscription) return false;
  return subscription.planId === planId && hasActiveSubscription(subscription);
}

// Check if user has premium features
export function hasPremiumFeatures(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  
  const plan = getSubscriptionPlanById(subscription.planId);
  return plan?.isPremium === true && hasActiveSubscription(subscription);
}

// Check if user has pro features
export function hasProFeatures(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  
  const plan = getSubscriptionPlanById(subscription.planId);
  if (!plan) return false;
  
  return (plan.id === 'pro' || plan.isPremium === true) && hasActiveSubscription(subscription);
}