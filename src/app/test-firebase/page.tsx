// src/app/test-firebase/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string>('Checking...');
  const [details, setDetails] = useState<{[key: string]: any}>({});

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        console.log('Checking Firebase initialization...');
        
        // Check auth
        if (auth) {
          console.log('Auth is initialized');
          setDetails(prev => ({ ...prev, auth: 'initialized' }));
        } else {
          console.log('Auth is not initialized');
          setDetails(prev => ({ ...prev, auth: 'not initialized' }));
        }
        
        // Check db
        if (db) {
          console.log('Firestore is initialized');
          setDetails(prev => ({ ...prev, db: 'initialized' }));
        } else {
          console.log('Firestore is not initialized');
          setDetails(prev => ({ ...prev, db: 'not initialized' }));
        }
        
        // Check environment variables
        const hasApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        
        console.log('Environment variables check:', { hasApiKey, hasProjectId });
        setDetails(prev => ({ 
          ...prev, 
          env: { 
            hasApiKey, 
            hasProjectId,
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'set' : 'not set',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'set' : 'not set'
          } 
        }));
        
        setStatus('Firebase check complete');
      } catch (error: any) {
        console.error('Error checking Firebase:', error);
        setStatus('Error checking Firebase');
        setDetails(prev => ({ ...prev, error: error.message }));
      }
    };

    checkFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Firebase Test</h1>
      
      <div className="glass-effect p-6 rounded-xl mb-6">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Status</h2>
        <p className="text-lg">{status}</p>
      </div>
      
      <div className="glass-effect p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Details</h2>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>
      
      <div className="mt-6 glass-effect p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Environment Variables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>NEXT_PUBLIC_FIREBASE_API_KEY:</strong></p>
            <p className="text-sm break-words">{process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'Not set'}</p>
          </div>
          <div>
            <p><strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</strong></p>
            <p className="text-sm break-words">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}