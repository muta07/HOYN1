
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db, googleProvider, createHOYNProfile, getUserProfiles, HOYNProfile } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Bu hook, Firebase kimlik doğrulama ve kullanıcı profili yönetimini merkezileştirir.
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<HOYNProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        try {
          // Kullanıcının mevcut profillerini Firestore'dan al
          // Kullanıcı oturum açmış mı kontrol et
          if (user.uid) {
            const profiles = await getUserProfiles(user.uid);
            if (profiles.length > 0) {
              // Öncelikli (isPrimary) veya ilk profili ayarla
              const primaryProfile = profiles.find(p => p.isPrimary) || profiles[0];
              setProfile(primaryProfile);
            } else {
              // Bu durum genellikle Google ile ilk kez giriş yapanlar için oluşur.
              // Onlar için aşağıda bir profil oluşturulur.
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        } catch (err: any) {
          console.error("Profil yüklenirken hata:", err);
          setError("Profil bilgileri yüklenemedi.");
          setProfile(null);
        }
      } else {
        // Kullanıcı çıkış yaptı
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthAction = async (action: Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      await action;
    } catch (error: any) {
      console.error("Kimlik doğrulama hatası:", error.code, error.message);
      // Firebase hata kodlarını Türkçe'ye çevir
      let friendlyMessage = "Bir hata oluştu. Lütfen tekrar deneyin.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          friendlyMessage = "E-posta veya şifre hatalı.";
          break;
        case 'auth/email-already-in-use':
          friendlyMessage = "Bu e-posta adresi zaten kullanılıyor.";
          break;
        case 'auth/weak-password':
          friendlyMessage = "Şifre çok zayıf. Lütfen en az 6 karakter kullanın.";
          break;
        case 'auth/invalid-email':
          friendlyMessage = "Geçersiz bir e-posta adresi girdiniz.";
          break;
        case 'auth/popup-closed-by-user':
          friendlyMessage = "Giriş penceresi kapatıldı. Lütfen tekrar deneyin.";
          break;
        default:
          friendlyMessage = "Giriş yapılamadı. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.";
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      // onAuthStateChanged zaten setLoading(false) yapacak, ama anlık UI tepkisi için burada da ayarlanabilir.
      setLoading(false);
    }
  };

  // E-posta/Şifre ile giriş
  const loginWithEmail = async (email: string, password: string) => {
    await handleAuthAction(signInWithEmailAndPassword(auth, email, password));
  };

  // E-posta/Şifre ile kişisel hesap kaydı
  const registerWithEmail = async (email: string, password: string, username: string, displayName: string) => {
    await handleAuthAction((async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        // Firestore'da 'personal' tipinde bir HOYN profili oluştur
        const newProfile = await createHOYNProfile(
          user.uid,
          {
            email: user.email!,
            nickname: displayName,
            username: username,
            type: 'personal',
            displayName: displayName,
          },
          true // İlk profili birincil yap
        );
        setProfile(newProfile);
      }
    })());
  };
  
    // E-posta/Şifre ile işletme hesabı kaydı
  const registerBusinessWithEmail = async (email: string, password: string, username: string, companyName: string, ownerName: string) => {
    await handleAuthAction((async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        // Firestore'da 'business' tipinde bir HOYN profili oluştur
        const newProfile = await createHOYNProfile(
          user.uid,
          {
            email: user.email!,
            nickname: companyName,
            username: username,
            type: 'business',
            companyName: companyName,
            ownerName: ownerName,
            businessType: 'Belirtilmedi',
          },
          true // İlk profili birincil yap
        );
        setProfile(newProfile);
      }
    })());
  };

  // Google ile giriş/kayıt
  const loginWithGoogle = async () => {
    await handleAuthAction((async () => {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      if (user) {
        // Kullanıcının daha önce bir profili var mı diye kontrol et
        const existingProfiles = await getUserProfiles(user.uid);
        if (existingProfiles.length === 0) {
          // Yeni kullanıcı: Google bilgileriyle 'personal' bir profil oluştur
          const username = user.email!.split('@')[0]; // E-postadan varsayılan bir kullanıcı adı oluştur
          const newProfile = await createHOYNProfile(
            user.uid,
            {
              email: user.email!,
              nickname: user.displayName || 'Yeni Kullanıcı',
              username: username,
              type: 'personal',
              displayName: user.displayName || 'Yeni Kullanıcı',
              avatar: user.photoURL || undefined,
            },
            true
          );
          setProfile(newProfile);
        }
        // Mevcut kullanıcının profili zaten onAuthStateChanged'de yüklenecek
      }
    })());
  };

  // Çıkış yap
  const logout = async () => {
    await handleAuthAction(signOut(auth));
  };

  return {
    user,
    profile,
    loading,
    error,
    accountType: profile?.type,
    loginWithEmail,
    registerWithEmail,
    registerBusinessWithEmail,
    loginWithGoogle,
    logout,
  };
};
