// src/components/ui/MessagesButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import MessagesPanel from './MessagesPanel';

export default function MessagesButton() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get current username
  const username = user?.displayName || 
    (user?.email ? user.email.split('@')[0] : 'kullanici');

  // Subscribe to unread messages count
  useEffect(() => {
    if (!user || !username) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'messages'),
      where('to', '==', username),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error('Unread messages count error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, username]);

  // Don't show if user is not authenticated
  if (!user) return null;

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <>
      <button
        onClick={handleTogglePanel}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          isPanelOpen 
            ? 'bg-purple-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
        aria-label={`Mesajlar ${unreadCount > 0 ? `(${unreadCount} okunmamış)` : ''}`}
        title="Mesajlar"
      >
        <div className="flex items-center justify-center w-6 h-6">
          <span className="text-lg">💬</span>
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping"></span>
          )}
        </div>
      </button>

      {/* Messages Panel */}
      <MessagesPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </>
  );
}