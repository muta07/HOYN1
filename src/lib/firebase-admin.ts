
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Projenin zaten başlatılıp başlatılmadığını kontrol et
if (!admin.apps.length) {
  try {
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string,
      'base64'
    ).toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Eğer Realtime Database kullanıyorsanız, databaseURL'i buraya ekleyin
      // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error', error.stack);
  }
}

// Firebase Admin servislerini dışa aktar
export const auth = admin.auth();
export const firestore = admin.firestore();
