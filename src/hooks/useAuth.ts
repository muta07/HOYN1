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
    console.log('useAuth: useEffect triggered');
    
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Cannot listen to auth state changes.');
      setLoading(false);
      return;
    }

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('useAuth: Timeout reached, forcing loading to false');
      setLoading(false);
      setError('Authentication timeout');
    }, 15000); // 15 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('useAuth: onAuthStateChanged triggered', { user });
      setUser(user);
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (user) {
        console.log('useAuth: User is logged in, loading profile...');
        try {
          // Kullanıcı giriş yaptıysa profil bilgilerini yükle
          // Önce business profile'a bak
          const businessProfile = await getBusinessProfile(user.uid);
          if (businessProfile) {
            console.log('useAuth: Business profile found', businessProfile);
            setProfile(businessProfile);
            setAccountType('business');
          } else {
            // Business yoksa personal profile'a bak
            const userProfile = await getUserProfile(user.uid);
            console.log('useAuth: Personal profile result', userProfile);
            setProfile(userProfile);
            setAccountType(userProfile ? 'personal' : null);
          }
        } catch (err: any) {
          console.error('useAuth: Error loading profile', err);
          setError(err.message || 'Error loading profile');
          // Even if there's an error loading the profile, we should still set loading to false
          setProfile(null);
          setAccountType(null);
        }
      } else {
        console.log('useAuth: User is logged out, clearing profile');
        // Kullanıcı çıkış yaptıysa profili temizle
        setProfile(null);
        setAccountType(null);
      }
      
      console.log('useAuth: Setting loading to false');
      setLoading(false);
    }, (error) => {
      // Error handler for onAuthStateChanged
      console.error('useAuth: Error in onAuthStateChanged', error);
      // Clear the timeout since we got an error
      clearTimeout(timeoutId);
      setLoading(false);
      setError(error.message || 'Authentication error');
    });

    return () => {
      console.log('useAuth: Unsubscribing from auth state changes');
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Email/Password ile giriş
  const loginWithEmail = async (email: string, password: string) => {
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Cannot login with email.');
      throw new Error('Firebase Auth is not initialized');
    }

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
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Cannot register with email.');
      throw new Error('Firebase Auth is not initialized');
    }

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
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Cannot login with Google.');
      throw new Error('Firebase Auth is not initialized');
    }

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
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Cannot register business with email.');
      throw new Error('Firebase Auth is not initialized');
    }

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
    // Check if Firebase is initialized
    if (!auth) {
      console.warn('Firebase Auth is not initialized. Cannot logout.');
      throw new Error('Firebase Auth is not initialized');
    }

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