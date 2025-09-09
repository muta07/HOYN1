'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  sendMessage, 
  sendAnonymousMessage, 
  getUserMessages, 
  getUserConversations,
  onConversationsSnapshot
} from '@/lib/firebase';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';
import MessageList from '@/components/social/MessageList';
import ConversationList from '@/components/social/ConversationList';

export default function MessagingTestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Load initial data
    const loadData = async () => {
      try {
        const userConversations = await getUserConversations(user.uid);
        setConversations(userConversations);
        
        if (userConversations.length > 0) {
          setSelectedConversation(userConversations[0]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time listener
    const unsub = onConversationsSnapshot(user.uid, (snapshotConversations) => {
      setConversations(snapshotConversations);
    });

    // Handle unsubscribe function
    const unsubscribe = unsub as unknown as (() => void) | { unsubscribe: () => void } | null;

    return () => {
      if (unsubscribe) {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        } else if (typeof unsubscribe === 'object' && unsubscribe !== null && 'unsubscribe' in unsubscribe) {
          const unsubObj = unsubscribe as { unsubscribe: () => void };
          if (typeof unsubObj.unsubscribe === 'function') {
            unsubObj.unsubscribe();
          }
        }
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedConversation) return;

    // Load messages for selected conversation
    const loadMessages = async () => {
      try {
        // In a real implementation, we would load messages for the specific conversation
        // For testing purposes, we'll just load all user messages
        const userMessages = await getUserMessages(user!.uid);
        setMessages(userMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [selectedConversation, user?.uid]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !recipientId) return;

    try {
      if (isAnonymous) {
        await sendAnonymousMessage(recipientId, messageText);
      } else {
        await sendMessage(user!.uid, recipientId, messageText);
      }
      
      setMessageText('');
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Loading messaging system..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Please Log In</h2>
          <p className="text-gray-400 mb-6">You need to be logged in to test the messaging system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
          Messaging System Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Controls */}
          <div className="lg:col-span-1 bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Send Test Message</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient User ID
                </label>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter recipient user ID"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter your message"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                  maxLength={300}
                />
                <div className="text-right text-xs text-gray-500">
                  {messageText.length}/300
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="anonymous" className="ml-2 text-sm text-gray-300">
                  Send anonymously
                </label>
              </div>

              <NeonButton
                onClick={handleSendMessage}
                disabled={!messageText.trim() || !recipientId}
                variant="primary"
                className="w-full"
              >
                Send Message
              </NeonButton>
            </div>

            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-bold text-white mb-2">Test Instructions</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Enter a valid recipient user ID</li>
                <li>• Write a message (1-300 characters)</li>
                <li>• Check "Send anonymously" for anonymous messages</li>
                <li>• Click "Send Message" to test</li>
                <li>• Check conversation list for updates</li>
              </ul>
            </div>
          </div>

          {/* Conversations */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="border-b border-gray-700 p-4">
                <h2 className="text-xl font-bold text-white">Conversations</h2>
              </div>
              
              <div className="h-96 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  currentUserId={user.uid}
                  onSelectConversation={setSelectedConversation}
                  selectedConversationId={selectedConversation?.id || null}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="border-b border-gray-700 p-4">
                <h2 className="text-xl font-bold text-white">
                  {selectedConversation 
                    ? `Messages with ${selectedConversation.isAnonymousThread ? 'Anonymous' : 'User'}`
                    : 'Select a conversation'}
                </h2>
              </div>
              
              <div className="h-96 overflow-y-auto">
                {selectedConversation ? (
                  <MessageList
                    messages={messages}
                    currentUserId={user.uid}
                    onMessageRead={(messageId) => console.log('Message read:', messageId)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Select a conversation to view messages
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}