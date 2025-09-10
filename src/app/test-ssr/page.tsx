// src/app/test-ssr/page.tsx
import { db, auth } from '@/lib/firebase';

export default async function TestSSRPage() {
  let firebaseStatus = 'unknown';
  let authStatus = 'unknown';
  
  try {
    console.log('Server-side: Checking Firebase status');
    if (db) {
      firebaseStatus = 'initialized';
      console.log('Server-side: Firestore is initialized');
    } else {
      firebaseStatus = 'not initialized';
      console.log('Server-side: Firestore is not initialized');
    }
    
    if (auth) {
      authStatus = 'initialized';
      console.log('Server-side: Auth is initialized');
    } else {
      authStatus = 'not initialized';
      console.log('Server-side: Auth is not initialized');
    }
  } catch (error) {
    console.error('Server-side: Error checking Firebase status:', error);
    firebaseStatus = 'error';
    authStatus = 'error';
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Server-Side Firebase Test</h1>
      
      <div className="glass-effect p-6 rounded-xl mb-6">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Status</h2>
        <p><strong>Firebase (Firestore):</strong> {firebaseStatus}</p>
        <p><strong>Firebase (Auth):</strong> {authStatus}</p>
      </div>
      
      <div className="glass-effect p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Environment Variables</h2>
        <p><strong>NEXT_PUBLIC_FIREBASE_API_KEY:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'set' : 'not set'}</p>
        <p><strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'set' : 'not set'}</p>
      </div>
    </div>
  );
}