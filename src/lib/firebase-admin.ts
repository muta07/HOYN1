import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Prevent re-initialization in development
if (!admin.apps.length) {
  try {
    // Try to use service account key file first
    try {
      const serviceAccountPath = resolve(process.cwd(), 'service-account-key.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } catch (fileError) {
      // Fallback to environment variables
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!privateKey) {
        throw new Error('The FIREBASE_PRIVATE_KEY environment variable is not set.');
      }
      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('The FIREBASE_CLIENT_EMAIL environment variable is not set.');
      }
      if (!process.env.FIREBASE_PROJECT_ID) {
        throw new Error('The FIREBASE_PROJECT_ID environment variable is not set.');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();
const storageAdmin = admin.storage();

export { firestoreAdmin, authAdmin, storageAdmin };