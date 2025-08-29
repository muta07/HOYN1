// src/app/ask/[username]/page.tsx
'use client';

import { useState } from 'react';

export default function AskPage({ params }: { params: { username: string } }) {
  const { username } = params;
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kullanıcı adını düzgün formatla (ilk harf büyük)
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Burada Firebase'e mesajı kaydet (ileride src/lib/api.ts ile yapılacak)
    try {
      // Örnek: await addDoc(collection(database, 'messages'), { from: isAnonymous ? 'Anonim' : 'Kullanıcı', message, to: username })
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simülasyon
      setSent(true);
    } catch (error) {
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-6">
            HOYN!
          </h1>
          <div className="bg-gray-900 p-8 rounded-xl border border-purple-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Mesaj Gönderildi!</h2>
            <p className="text-gray-300">
              {displayName} adlı kullanıcıya anonim mesajın iletildi. Umarız cevabını alırsın!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="max-w-md w-full">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-6 text-center">
          HOYN!
        </h1>

        <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
          <h2 className="text-2xl font-bold text-white mb-2">
            {displayName}'a Soru Sor
          </h2>
          <p className="text-gray-300 mb-6 text-sm">
            Merak ettiğin her şeyi sorabilirsin. Kim olduğunu kimse öğrenmeyecek.
          </p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Merhaba ${displayName}, sana ne sormak istersin?`}
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg mb-4 h-32 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
            maxLength={500}
            required
          />

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={() => setIsAnonymous(!isAnonymous)}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"
            />
            <label htmlFor="anonymous" className="ml-2 text-gray-300">
              Anonim olarak gönder
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-bold text-white disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg transition"
          >
            {loading ? 'Gönderiliyor...' : 'Mesajı Gönder'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          HOYN! ile tanış. QR kodunla kim olduğunu göster.
        </p>
      </form>
    </div>
  );
}