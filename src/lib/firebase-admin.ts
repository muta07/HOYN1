
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

// Projenin zaten başlatılıp başlatılmadığını kontrol et
if (!admin.apps.length) {
  try {
    // Vercel'de ortam değişkenleri base64 olarak ayarlanabilir
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        // Base64 decode et ve JSON olarak parse et
        const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const buff = Buffer.from(base64Key, 'base64');
        const serviceAccountString = buff.toString('utf-8');
        const serviceAccount = JSON.parse(serviceAccountString);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          // Eğer Realtime Database kullanıyorsanız, databaseURL'i buraya ekleyin
          // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        console.log('Firebase Admin SDK initialized successfully.');
      } catch (parseError) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
        console.error('Parse error:', parseError);
        throw parseError;
      }
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Firebase Admin SDK will not be initialized.');
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Firebase Admin servislerini dışa aktar
// Firebase başlatılmadıysa, servisleri başlatmadan dışa aktar
const auth = admin.apps.length > 0 ? admin.auth() : null;
const firestore: Firestore | null = admin.apps.length > 0 ? admin.firestore() : null;

export { auth, firestore };
