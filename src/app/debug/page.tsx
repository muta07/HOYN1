// src/app/debug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';

export default function DebugPage() {
  const { user, loading, error, profile, accountType } = useAuth();
  const [firebaseState, setFirebaseState] = useState<string>('unknown');

  useEffect(() => {
    // Check Firebase initialization
    if (typeof window !== 'undefined') {
      if (auth) {
        setFirebaseState('initialized');
      } else {
        setFirebaseState('not initialized');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-purple-400">Auth State</h2>
          <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
          <p><strong>User:</strong> {user ? user.uid : 'null'}</p>
          <p><strong>User Email:</strong> {user?.email || 'null'}</p>
          <p><strong>Error:</strong> {error || 'null'}</p>
        </div>
        
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-purple-400">Profile State</h2>
          <p><strong>Account Type:</strong> {accountType || 'null'}</p>
          <p><strong>Profile:</strong> {profile ? 'exists' : 'null'}</p>
          {profile && (
            <div className="mt-2">
              <p><strong>Profile ID:</strong> {profile.id}</p>
              <p><strong>Profile Type:</strong> {'type' in profile ? profile.type : 'N/A'}</p>
            </div>
          )}
        </div>
        
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-purple-400">Firebase State</h2>
          <p><strong>Firebase Auth:</strong> {firebaseState}</p>
          <p><strong>Window Object:</strong> {typeof window !== 'undefined' ? 'available' : 'not available'}</p>
        </div>
        
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-purple-400">Environment</h2>
          <p><strong>NEXT_PUBLIC_FIREBASE_API_KEY:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'set' : 'not set'}</p>
          <p><strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'set' : 'not set'}</p>
        </div>
      </div>
      
      <div className="mt-8 glass-effect p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Raw Data</h2>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-auto max-h-60">
          {JSON.stringify({ user, profile, loading, error, accountType }, null, 2)}
        </pre>
      </div>
    </div>
  );
}