'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import { getUserSettings } from '@/lib/firebase';

interface MessageSenderProps {
  recipientId: string;
  recipientName: string;
  onMessageSent?: () => void;
}

export default function MessageSender({ recipientId, recipientName, onMessageSent }: MessageSenderProps) {
  const { user } = useAuth();
  const [showButtons, setShowButtons] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [canReceiveMessages, setCanReceiveMessages] = useState(true);
  const [canReceiveAnonymous, setCanReceiveAnonymous] = useState(true);

  // Check recipient's message settings when component mounts
  useState(() => {
    const checkSettings = async () => {
      if (recipientId) {
        const settings = await getUserSettings(recipientId);
        if (settings) {
          setCanReceiveMessages(settings.canReceiveMessages);
          setCanReceiveAnonymous(settings.canReceiveAnonymous);
        }
      }
    };
    checkSettings();
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          recipientId,
          text: message,
          isAnonymous,
          senderName: user.displayName || user.email?.split('@')[0] || 'Unknown'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      setMessage('');
      onMessageSent?.();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  if (!user || user.uid === recipientId) {
    return null;
  }

  return (
    <div className="relative">
      <NeonButton
        onClick={() => setShowButtons(!showButtons)}
        variant="primary"
        size="md"
        className="w-full"
      >
        💬 Mesaj Gönder
      </NeonButton>

      {showButtons && (
        <div className="absolute bottom-full right-0 mb-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 p-2">
          {canReceiveMessages && (
            <button
              onClick={() => {
                setIsAnonymous(false);
                setShowModal(true);
                setShowButtons(false);
              }}
              className="w-full text-left p-2 hover:bg-gray-800 rounded text-white"
            >
              📨 Normal Mesaj Gönder
            </button>
          )}
          
          {canReceiveAnonymous && (
            <button
              onClick={() => {
                setIsAnonymous(true);
                setShowModal(true);
                setShowButtons(false);
              }}
              className="w-full text-left p-2 hover:bg-gray-800 rounded text-white"
            >
              🕵️‍♂️ Anonim Mesaj Gönder
            </button>
          )}
          
          {!canReceiveMessages && !canReceiveAnonymous && (
            <div className="p-2 text-gray-400 text-sm">
              Bu kullanıcı mesaj almayı devre dışı bırakmış
            </div>
          )}
        </div>
      )}

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {isAnonymous ? 'Anonim Mesaj Gönder' : 'Mesaj Gönder'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {isAnonymous ? (
              <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-purple-300 text-sm">
                  Bu mesaj anonim olarak gönderilecek. Kimliğiniz gizli kalacak.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  Bu mesaj {recipientName} kullanıcısına gönderilecek.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mesajınız
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajınızı buraya yazın..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-32 resize-none focus:border-purple-500"
                maxLength={isAnonymous ? 100 : 300}
              />
              <div className="text-right text-xs text-gray-500">
                {message.length}/{isAnonymous ? 100 : 300}
              </div>
            </div>

            <div className="flex gap-3">
              <NeonButton
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                variant="primary"
                size="md"
                className="flex-1"
              >
                {sending ? 'Gönderiliyor...' : 'Mesaj Gönder'}
              </NeonButton>
              <NeonButton
                onClick={() => setShowModal(false)}
                variant="outline"
                size="md"
                className="flex-1"
              >
                İptal
              </NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}