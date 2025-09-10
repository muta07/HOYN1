// src/app/test-loading/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TestLoadingPage() {
  const { user, loading, error } = useAuth();
  const [status, setStatus] = useState('initial');

  useEffect(() => {
    console.log('TestLoadingPage: useEffect triggered', { user, loading, error });
    setStatus(`User: ${user ? user.uid : 'null'}, Loading: ${loading}, Error: ${error || 'null'}`);
  }, [user, loading, error]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Test Loading State</h1>
      
      <div className="glass-effect p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Current Status</h2>
        <p className="text-lg">{status}</p>
      </div>
      
      <div className="mt-6 glass-effect p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Debug Info</h2>
        <p><strong>User:</strong> {user ? user.email : 'null'}</p>
        <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
        <p><strong>Error:</strong> {error || 'null'}</p>
      </div>
    </div>
  );
}