// src/app/test-auth/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const { loginWithEmail, user, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
      <div className="glass-effect p-8 rounded-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Test Authentication</h1>
        
        {user ? (
          <div className="text-center">
            <p className="mb-4">Logged in as: {user.email}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="cyber-border px-6 py-3 rounded-lg font-bold hover:glow-intense transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full cyber-border px-6 py-3 rounded-lg font-bold hover:glow-intense transition-all disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-300">Error: {error}</p>
              </div>
            )}
          </form>
        )}
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/')}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}