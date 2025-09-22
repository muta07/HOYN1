
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function BusinessRegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { user, loading, registerBusinessWithEmail, error } = useAuth();
  const router = useRouter();

  // Zaten giriş yapmış kullanıcıyı yönlendir
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Sadece kayıt için zorunlu olan bilgilerle işletme hesabı oluştur
      await registerBusinessWithEmail(email, password, username, companyName, ownerName);
      // Başarılı kayıt sonrası yönlendirme useEffect ile yapılacak
    } catch (err) {
      // Hata `useAuth` hook'u tarafından yakalanıp `error` state'ine yazılıyor
      console.error("İşletme kaydı hatası:", err);
    }
  };
  
  if (loading && !error) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loading size="lg" text="İşletme hesabınız oluşturuluyor..." />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <AnimatedCard direction="scale" delay={0}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
              🏢 İşletme Hesabı
            </h1>
            <p className="text-gray-300 mb-2">İşletmeni dijital dünyaya taşı!</p>
          </div>
        </AnimatedCard>

        <AnimatedCard direction="up" delay={200}>
          <form onSubmit={handleSubmit} className="glass-effect p-8 rounded-xl cyber-border space-y-6">
            
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-center">
                {error}
              </div>
            )}

            {/* Temel Bilgiler */}
            <div className="border-b border-purple-900/50 pb-6">
              <h2 className="text-xl font-bold text-purple-300 mb-4">Temel Bilgiler</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">İşletme Adı *</label>
                  <input
                    type="text"
                    placeholder="ABC Teknoloji"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yetkili Adı Soyadı *</label>
                  <input
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hesap Bilgileri */}
            <div>
              <h2 className="text-xl font-bold text-purple-300 mb-4">Hesap Bilgileri</h2>
              <div className="space-y-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Benzersiz Kullanıcı Adı *</label>
                  <input
                    type="text"
                    placeholder="abcteknoloji (sadece küçük harf, rakam)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Giriş için E-posta *</label>
                  <input
                    type="email"
                    placeholder="info@abcteknoloji.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Şifre *</label>
                  <input
                    type="password"
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <NeonButton type="submit" variant="primary" size="lg" glow disabled={loading} className="w-full">
                {loading ? 'Hesap Oluşturuluyor...' : '🚀 İşletme Hesabı Oluştur'}
              </NeonButton>
            </div>

            <p className="text-sm text-gray-400 pt-4 text-center">
              Zaten bir hesabın var mı?{' '}
              <span onClick={() => router.push('/auth/login')} className="text-purple-400 hover:text-purple-300 cursor-pointer font-bold transition-colors">
                Giriş Yap
              </span>
            </p>
          </form>
        </AnimatedCard>
      </div>
    </div>
  );
}
