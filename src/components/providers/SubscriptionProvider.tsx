// src/components/providers/SubscriptionProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserSubscription, getSubscriptionPlans, SubscriptionPlan } from '@/lib/subscriptions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  hasActiveSubscription: boolean;
  hasPremiumFeatures: boolean;
  hasProFeatures: boolean;
  hasPremiumAccess: boolean;
  isOnPlan: (planId: string) => boolean;
  subscribeToPlan: (planId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const plans = getSubscriptionPlans();
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Cleanup function to set isMountedRef to false when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load user subscription
  const loadSubscription = async () => {
    if (!user) {
      if (isMountedRef.current) {
        setSubscription(null);
        setLoading(false);
      }
      return;
    }

    try {
      const subscriptionRef = doc(db, 'subscriptions', user.uid);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!isMountedRef.current) return;
      
      if (subscriptionDoc.exists()) {
        const subscriptionData = subscriptionDoc.data();
        setSubscription({
          id: subscriptionDoc.id,
          userId: subscriptionData.userId,
          planId: subscriptionData.planId,
          status: subscriptionData.status,
          startDate: subscriptionData.startDate?.toDate() || new Date(),
          endDate: subscriptionData.endDate?.toDate() || new Date(),
          trialEndDate: subscriptionData.trialEndDate?.toDate(),
          cancelDate: subscriptionData.cancelDate?.toDate(),
          paymentMethod: subscriptionData.paymentMethod,
          autoRenew: subscriptionData.autoRenew
        });
      } else {
        // Create default free subscription
        const defaultSubscription: UserSubscription = {
          userId: user.uid,
          planId: 'basic',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          autoRenew: false
        };
        
        if (isMountedRef.current) {
          await setDoc(subscriptionRef, {
            ...defaultSubscription,
            startDate: defaultSubscription.startDate,
            endDate: defaultSubscription.endDate
          });
          
          setSubscription(defaultSubscription);
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error loading subscription:', error);
        setSubscription(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Subscribe to a plan
  const subscribeToPlan = async (planId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const subscriptionRef = doc(db, 'subscriptions', user.uid);
      const newSubscription: UserSubscription = {
        userId: user.uid,
        planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        autoRenew: true
      };
      
      if (isMountedRef.current) {
        await setDoc(subscriptionRef, {
          ...newSubscription,
          startDate: newSubscription.startDate,
          endDate: newSubscription.endDate
        });
        
        setSubscription(newSubscription);
      }
      return true;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      return false;
    }
  };

  // Cancel subscription
  const cancelSubscription = async (): Promise<boolean> => {
    if (!user || !subscription) return false;

    try {
      const subscriptionRef = doc(db, 'subscriptions', user.uid);
      const updatedSubscription: UserSubscription = {
        ...subscription,
        status: 'cancelled' as 'active' | 'cancelled' | 'expired' | 'trial',
        cancelDate: new Date()
      };
      
      if (isMountedRef.current) {
        await setDoc(subscriptionRef, {
          ...updatedSubscription,
          startDate: updatedSubscription.startDate,
          endDate: updatedSubscription.endDate,
          cancelDate: updatedSubscription.cancelDate
        }, { merge: true });
        
        setSubscription(updatedSubscription);
      }
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    if (isMountedRef.current) {
      setLoading(true);
      await loadSubscription();
    }
  };

  // Check plan access
  const isOnPlan = (planId: string): boolean => {
    if (!subscription) return false;
    return subscription.planId === planId && subscription.status === 'active';
  };

  // Check premium features
  const hasPremiumFeatures = subscription?.planId === 'business' && subscription?.status === 'active';

  // Check pro features
  const hasProFeatures = (subscription?.planId === 'pro' || subscription?.planId === 'business') && 
                         subscription?.status === 'active';

  // Check active subscription
  const hasActiveSubscription = subscription?.status === 'active' && 
                               subscription?.endDate > new Date();
                               
  // Check premium access (Pro or Business plan)
  const hasPremiumAccess = (subscription?.planId === 'pro' || subscription?.planId === 'business') && 
                          subscription?.status === 'active';

  useEffect(() => {
    loadSubscription();
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, [user]);

  const value: SubscriptionContextType = {
    subscription,
    plans,
    loading,
    hasActiveSubscription,
    hasPremiumFeatures,
    hasProFeatures,
    hasPremiumAccess,
    isOnPlan,
    subscribeToPlan,
    cancelSubscription,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}