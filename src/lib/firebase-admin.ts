import * as admin from 'firebase-admin';

// Prevent re-initialization in development
if (!admin.apps.length) {
  try {
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
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();
const storageAdmin = admin.storage();

export { firestoreAdmin, authAdmin, storageAdmin };
