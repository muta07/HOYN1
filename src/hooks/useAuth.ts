// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { auth, UserProfile, BusinessProfile } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { createUserProfile, getUserProfile, createBusinessProfile, getBusinessProfile } from '@/lib/qr-utils';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'personal' | 'business' | null>(null);

  useEffect(() => {
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Cannot listen to auth state changes.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Kullanıcı giriş yaptıysa profil bilgilerini yükle
        // Önce business profile'a bak
        const businessProfile = await getBusinessProfile(user.uid);
        if (businessProfile) {
          setProfile(businessProfile);
          setAccountType('business');
        } else {
          // Business yoksa personal profile'a bak
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
          setAccountType(userProfile ? 'personal' : null);
        }
      } else {
        // Kullanıcı çıkış yaptıysa profili temizle
        setProfile(null);
        setAccountType(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password ile giriş
  const loginWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email/Password ile kayıt
  const registerWithEmail = async (email: string, password: string, displayName?: string, nickname?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
        // Firestore'da kullanıcı profili oluştur
        const userProfile = await createUserProfile(result.user, displayName, nickname);
        setProfile(userProfile);
      }
      
      return result.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google ile giriş
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email/Password ile business kayıt
  const registerBusinessWithEmail = async (
    email: string, 
    password: string, 
    companyName: string,
    ownerName: string,
    nickname?: string,
    businessType?: string,
    address?: string,
    phone?: string,
    website?: string,
    description?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        const displayName = `${companyName} (${ownerName})`;
        await updateProfile(result.user, { displayName });
        
        // Firestore'da business profili oluştur
        const businessProfile = await createBusinessProfile(
          result.user, 
          companyName, 
          ownerName, 
          nickname || companyName,
          businessType || 'Diğer',
          address,
          phone,
          website,
          description
        );
        setProfile(businessProfile);
        setAccountType('business');
      }
      
      return result.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    user, 
    profile,
    accountType,
    loading, 
    error,
    loginWithEmail,
    registerWithEmail,
    registerBusinessWithEmail,
    loginWithGoogle,
    logout
  };
};