// Base Profile Interface
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

export interface BaseProfile {
  uid: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  
  // Social features (Phase 5.3)
  followersCount?: number;
  followingCount?: number;
}

// Multiple Profiles Support
export interface HOYNProfile extends BaseProfile {
  id: string;
  ownerUid: string;
  type: 'personal' | 'business';
  qrData?: {
    encryptedPayload: string;
    version: string;
    timestamp: Date;
    checksum: string;
  };
  isActive: boolean;
  isPrimary: boolean;
}

export type ProfileType = UserProfile | BusinessProfile | HOYNProfile;

// User Profile Interface
export interface UserProfile extends BaseProfile {
  displayName: string; // Gerçek ad
  bio?: string;
  
  // Social media links
  instagram?: string;
  twitter?: string;
  
  // Settings
  allowAnonymous?: boolean;
  
  // Phase 5.2 - Profile customization
  profileCustomization?: {
    theme?: 'cyberpunk' | 'neon' | 'minimal' | 'dark' | 'colorful' | 'retro';
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: 'orbitron' | 'roboto' | 'inter' | 'poppins' | 'jetbrains';
    borderStyle?: 'sharp' | 'rounded' | 'cyber' | 'minimal';
    animationStyle?: 'none' | 'subtle' | 'dynamic' | 'intense';
    customCSS?: string;
    backgroundImage?: string;
    useGradient?: boolean;
    gradientDirection?: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';
    profileLayout?: 'standard' | 'compact' | 'detailed' | 'creative';
    showCustomization?: boolean;
  };
}

// Business Profile Interface
export interface BusinessProfile extends BaseProfile {
  companyName: string;
  ownerName: string;
  businessType: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  
  // Enhanced Business specific fields
  employees?: string[];
  menuItems?: any[];
  qrCodes?: string[];
  isVerified?: boolean;
  
  // Phase 5.1 - New business fields
  sector?: string;           // İş sektörü
  foundedYear?: number;      // Kuruluş yılı
  employeeCount?: string;    // Çalışan sayısı aralığı
  services?: string[];       // Sunulan hizmetler
  workingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  contactInfo?: {
    whatsapp?: string;
    telegram?: string;
    email2?: string;         // İkinci email
    fax?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    district?: string;
    country?: string;
  };
  businessSettings?: {
    showEmployeeCount?: boolean;
    showFoundedYear?: boolean;
    showWorkingHours?: boolean;
    allowDirectMessages?: boolean;
    showLocation?: boolean;
  };
}

// Firebase yapılandırması (Firebase v7.20.0+ uyumlu)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDJN3wqeaNxmk9l1I3Lg3KD8r2G6ziMZxM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hoyn-demo.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://hoyn-demo-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hoyn-demo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hoyn-demo.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "818752786451",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:818752786451:web:d3dc938ad4ee898a9d6fe6",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HQ6KYZZPQG"
};

// QR Encryption Utilities
const HOYN_APP_SECRET = process.env.NEXT_PUBLIC_HOYN_QR_SECRET || 'hoyn-secret-key-2025'; // Should be proper env var

export function encryptHOYNQR(payload: string): string {
  // Simple XOR encryption for demo - replace with proper AES in production
  let encrypted = '';
  for (let i = 0; i < payload.length; i++) {
    encrypted += String.fromCharCode(payload.charCodeAt(i) ^ HOYN_APP_SECRET.charCodeAt(i % HOYN_APP_SECRET.length));
  }
  return btoa(encrypted); // Base64 encode
}

export function decryptHOYNQR(encrypted: string): string | null {
  try {
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ HOYN_APP_SECRET.charCodeAt(i % HOYN_APP_SECRET.length));
    }
    return decrypted;
  } catch {
    return null;
  }
}

export function isHOYNQR(encryptedData: string): boolean {
  const decrypted = decryptHOYNQR(encryptedData);
  if (!decrypted) return false;
  try {
    const data = JSON.parse(decrypted);
    return data.app === 'HOYN' && data.type === 'profile';
  } catch {
    return false;
  }
}

export function generateQRPayload(profileId: string, username: string): string {
  const payload = JSON.stringify({
    app: 'HOYN',
    type: 'profile',
    version: '1.0',
    profileId,
    username,
    timestamp: new Date().toISOString()
  });
  return encryptHOYNQR(payload);
}

// Firebase başlat
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Multiple Profile Functions
export async function createHOYNProfile(ownerUid: string, profileData: Omit<HOYNProfile, 'id' | 'ownerUid' | 'qrData' | 'isActive' | 'isPrimary'> & { username: string; type: 'personal' | 'business' }, isPrimary: boolean = false): Promise<HOYNProfile | null> {
  try {
    const profileId = `${profileData.username}-${Date.now()}`;
    const profileRef = doc(db, 'profiles', profileId);
    
    const fullProfile: HOYNProfile = {
      ...profileData,
      id: profileId,
      ownerUid,
      type: profileData.type,
      qrData: {
        encryptedPayload: generateQRPayload(profileId, profileData.username),
        version: '1.0',
        timestamp: new Date(),
        checksum: 'todo-hash'
      },
      isActive: true,
      isPrimary,
      createdAt: new Date(),
      updatedAt: new Date(),
      uid: ownerUid, // For compatibility
      followersCount: 0,
      followingCount: 0
    };

    await setDoc(profileRef, fullProfile);
    return fullProfile;
  } catch (error) {
    console.error('Failed to create profile:', error);
    return null;
  }
}

export async function getHOYNProfileByUsername(username: string): Promise<HOYNProfile | null> {
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('username', '==', username), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnapshot = snapshot.docs[0];
    return { ...docSnapshot.data() as HOYNProfile, id: docSnapshot.id };
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
}

export async function getUserProfiles(ownerUid: string): Promise<HOYNProfile[]> {
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('ownerUid', '==', ownerUid), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() as HOYNProfile, id: doc.id }));
  } catch (error) {
    console.error('Failed to get user profiles:', error);
    return [];
  }
}

export async function updateHOYNProfile(profileId: string, data: Partial<HOYNProfile>): Promise<boolean> {
  try {
    const profileRef = doc(db, 'profiles', profileId);
    await setDoc(profileRef, { ...data, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return false;
  }
}

export async function trackQRScan(scannerUid: string, targetUsername: string, qrType: string): Promise<void> {
  try {
    const scanData = {
      scannerUid,
      targetUsername,
      qrType,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    };
    
    await addDoc(collection(db, 'qrScans'), scanData);
    console.log('QR scan tracked:', scanData);
  } catch (error) {
    console.error('Failed to track QR scan:', error);
  }
}

// Hizmetleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);
export const storage = getStorage(app);
