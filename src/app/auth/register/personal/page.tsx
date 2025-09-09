// src/app/auth/register/personal/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PersonalRegisterPage() {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const { registerWithEmail, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // useAuth hook'unu kullanarak kullanıcı oluştur ve displayName ile nickname'i ayarla
      await registerWithEmail(email, password, name, nickname || name);

      // Burada kullanıcı verisini Firestore veya Realtime DB'ye kaydet
      // Örnek (ileride genişletilecek):
      // await setDoc(doc(db, 'users', user.uid), {
      //   name,
      //   email,
      //   bio,
      //   createdAt: new Date()
      // });

      // Kayıt başarılı, dashboard'a yönlendir
      router.push('/dashboard');
    } catch (error: any) {
      alert('Kayıt başarısız: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="max-w-md w-full">
        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent font-orbitron mb-6 text-center">
          HOYN!
        </h1>
        <p className="text-gray-300 mb-6 text-center">Bilgilerini gir</p>

        <input
          type="text"
          placeholder="Ad Soyad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-4"
          required
        />

        <input
          type="text"
          placeholder="Takma Ad (Nickname) - İsteğe bağlı"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-4"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-4"
          required
        />

        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-4"
          required
        />

        <textarea
          placeholder="Bio (isteğe bağlı)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg mb-6 h-24"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-800 py-3 rounded-lg font-bold disabled:opacity-70 hover:from-purple-500 hover:to-purple-700 transition-all duration-300 active:scale-95"
        >
          {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
        </button>
      </form>
    </div>
  );
}