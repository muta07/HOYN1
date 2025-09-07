// src/hooks/useSubscriptionFeatures.ts
import { useSubscription } from '@/components/providers/SubscriptionProvider';

export function useSubscriptionFeatures() {
  const {
    subscription,
    plans,
    loading,
    hasActiveSubscription,
    hasPremiumFeatures,
    hasProFeatures,
    isOnPlan
  } = useSubscription();

  // Check if user can create unlimited QR codes (Pro or Business plan)
  const canCreateUnlimitedQR = hasProFeatures || hasPremiumFeatures;

  // Check if user has access to advanced customization (Pro or Business plan)
  const hasAdvancedCustomization = hasProFeatures || hasPremiumFeatures;

  // Check if user has access to analytics (Pro or Business plan)
  const hasAnalyticsAccess = hasProFeatures || hasPremiumFeatures;

  // Check if user has business features (Business plan only)
  const hasBusinessFeatures = hasPremiumFeatures;

  // Get current plan details
  const currentPlan = subscription ? plans.find(plan => plan.id === subscription.planId) : null;

  // Get plan limits
  const getQRLimit = () => {
    if (!currentPlan) return 5; // Default limit for Basic plan
    
    switch (currentPlan.id) {
      case 'basic':
        return 5;
      case 'pro':
      case 'business':
        return Infinity; // Unlimited
      default:
        return 5;
    }
  };

  return {
    subscription,
    currentPlan,
    loading,
    hasActiveSubscription,
    hasPremiumFeatures,
    hasProFeatures,
    canCreateUnlimitedQR,
    hasAdvancedCustomization,
    hasAnalyticsAccess,
    hasBusinessFeatures,
    isOnPlan,
    getQRLimit
  };
}