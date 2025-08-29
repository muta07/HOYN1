// src/app/auth/register/personal/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function PersonalRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Firebase Authentication ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="max-w-md w-full">
        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-6 text-center">
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
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-bold disabled:opacity-70"
        >
          {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
        </button>
      </form>
    </div>
  );
}