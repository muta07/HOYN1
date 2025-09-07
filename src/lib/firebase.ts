// Base Profile Interface
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
  
  followersCount?: number;
  followingCount?: number;
}

// Updated HOYNProfile to use the new QR URL structure
export interface HOYNProfile extends BaseProfile {
  id: string;
  ownerUid: string;
  type: 'personal' | 'business';
  qrData?: {
    qrUrl: string; // Stores the generated URL e.g., https://hoyn.app/qr/v1?d=...
    version: string;
    timestamp: Date;
  };
  isActive: boolean;
  isPrimary: boolean;
}

export type ProfileType = UserProfile | BusinessProfile | HOYNProfile;

export interface UserProfile extends BaseProfile {
  displayName: string;
  bio?: string;
  instagram?: string;
  twitter?: string;
  allowAnonymous?: boolean;
  qrGenerated?: boolean;
  qrMode?: 'profile' | 'note' | 'song';
  qrBase64?: string;
  qrGeneratedAt?: string;
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

export interface BusinessProfile extends BaseProfile {
  companyName: string;
  ownerName: string;
  businessType: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  employees?: string[];
  menuItems?: any[];
  qrCodes?: string[];
  isVerified?: boolean;
  sector?: string;
  foundedYear?: number;
  employeeCount?: string;
  services?: string[];
  workingHours?: { [key: string]: string };
  socialMedia?: { [key: string]: string };
  contactInfo?: { [key: string]: string };
  location?: { [key: string]: any };
  businessSettings?: { [key: string]: boolean };
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Removed old QR encryption functions to standardize logic in qr-utils.ts

declare global {
  var firebaseApp: import('firebase/app').FirebaseApp | undefined;
}

let app;

if (typeof window !== 'undefined' && !globalThis.firebaseApp) {
  app = initializeApp(firebaseConfig);
  globalThis.firebaseApp = app;
} else if (typeof window !== 'undefined') {
  app = globalThis.firebaseApp!;
} else {
  // On the server, we might need to initialize it differently or ensure it's initialized.
  // For now, this will re-initialize on the server on every import, which is not ideal.
  // A better pattern for App Router is to use a singleton pattern.
  app = initializeApp(firebaseConfig);
}

// Updated createHOYNProfile to use the new standardized QR generation
export async function createHOYNProfile(ownerUid: string, profileData: Omit<HOYNProfile, 'id' | 'ownerUid' | 'qrData' | 'isActive' | 'isPrimary'>, isPrimary: boolean = false): Promise<HOYNProfile | null> {
  try {
    // Dynamically import to prevent circular dependency
    const { generateHOYNQR } = await import('./qr-utils');
    
    const profileId = `${profileData.username}-${Date.now()}`;
    const profileRef = doc(db, 'profiles', profileId);
    
    const qrUrl = generateHOYNQR(profileData.username, profileData.type as 'profile' | 'anonymous');

    const fullProfile: HOYNProfile = {
      ...profileData,
      id: profileId,
      ownerUid,
      qrData: {
        qrUrl: qrUrl,
        version: '1.2', // Corresponds to the new URL-based format
        timestamp: new Date(),
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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);
export const storage = getStorage(app);