// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// User Profile Interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string; // Gerçek ad
  nickname: string;    // Takma ad
  bio?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;    // Email'den türetilen unique username
}

// Business Profile Interface
export interface BusinessProfile {
  uid: string;
  email: string;
  companyName: string;
  ownerName: string;
  nickname: string;    // Business nickname/brand name
  businessType: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;    // Email'den türetilen unique username
  // Business specific fields
  employees?: string[];
  menuItems?: any[];
  qrCodes?: string[];
  isVerified?: boolean;
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