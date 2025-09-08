'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { onConversationsSnapshot, getUserConversations } from '@/lib/firebase';

interface MessagesContextType {
  totalUnread: number;
  hasUnreadMessages: boolean;
  refreshUnreadCount: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setTotalUnread(0);
      setHasUnreadMessages(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const loadUnreadCount = async () => {
      try {
        const conversations = await getUserConversations(user.uid);
        const unreadCount = conversations.reduce((sum, conv) => {
          return sum + (conv.unreadCounts?.[user.uid] || 0);
        }, 0);
        
        setTotalUnread(unreadCount);
        setHasUnreadMessages(unreadCount > 0);
      } catch (error) {
        console.error('Failed to load unread count:', error);
        setTotalUnread(0);
        setHasUnreadMessages(false);
      }
    };

    loadUnreadCount();

    // Set up real-time listener for conversations
    unsubscribe = onConversationsSnapshot(user.uid, (conversations) => {
      const unreadCount = conversations.reduce((sum, conv) => {
        return sum + (conv.unreadCounts?.[user.uid] || 0);
      }, 0);
      
      setTotalUnread(unreadCount);
      setHasUnreadMessages(unreadCount > 0);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const refreshUnreadCount = async () => {
    if (!user?.uid) return;

    try {
      const conversations = await getUserConversations(user.uid);
      const unreadCount = conversations.reduce((sum, conv) => {
        return sum + (conv.unreadCounts?.[user.uid] || 0);
      }, 0);
      
      setTotalUnread(unreadCount);
      setHasUnreadMessages(unreadCount > 0);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  };

  return (
    <MessagesContext.Provider value={{ totalUnread, hasUnreadMessages, refreshUnreadCount }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};