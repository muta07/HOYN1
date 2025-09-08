'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';

interface ProfileMessageSenderProps {
  profileId: string;
  profileOwnerUid: string;
  onMessageSent?: () => void;
}

export default function ProfileMessageSender({ profileId, profileOwnerUid, onMessageSent }: ProfileMessageSenderProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    setSending(true);
    try {
      const response = await fetch('/api/profile-messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          content: message,
          senderId: isAnonymous ? null : user.uid,
          isAnonymous,
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

  // Don't show message button if user is the profile owner
  if (!user || user.uid === profileOwnerUid) {
    return null;
  }

  return (
    <div className="relative">
      <NeonButton
        onClick={() => setShowModal(true)}
        variant="primary"
        size="md"
        className="w-full"
      >
        💬 Mesaj Gönder
      </NeonButton>

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
                className="text-gray-400 hover:text-white text-2xl"
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
                  Bu mesaj profil sahibine gönderilecek.
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
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-32 resize-none focus:border-purple-500 focus:outline-none"
                maxLength={isAnonymous ? 100 : 300}
              />
              <div className="text-right text-xs text-gray-500">
                {message.length}/{isAnonymous ? 100 : 300}
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-300">Anonim olarak gönder</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
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