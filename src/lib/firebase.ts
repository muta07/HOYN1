// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Base Profile Interface
export interface BaseProfile {
  uid: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
}

// User Profile Interface
export interface UserProfile extends BaseProfile {
  displayName: string; // Gerçek ad
  bio?: string;
  
  // Social media links
  instagram?: string;
  twitter?: string;
  
  // Settings
  allowAnonymous?: boolean;
  
  // Social features (Phase 5.3)
  followersCount?: number;
  followingCount?: number;
  
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

// Firebase başlat
const app = initializeApp(firebaseConfig);

// Hizmetleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);
export const storage = getStorage(app);