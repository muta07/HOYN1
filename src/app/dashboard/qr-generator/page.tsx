'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ClientQRGenerator from '@/components/qr/ClientQRGenerator';
import Loading from '@/components/ui/Loading';
import NeonButton from '@/components/ui/NeonButton';

export default function QRGeneratorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?returnUrl=/dashboard/qr-generator');
    }
  }, [user, authLoading, router]);

  const generateSingleUseToken = async () => {
    if (!user) {
      setError('Bu işlemi yapmak için giriş yapmalısınız.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setQrToken(null);

    try {
      // Firebase kullanıcısından ID token al
      const idToken = await user.getIdToken();

      // API endpoint'ine POST isteği gönder
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token oluşturulamadı.');
      }

      const data = await response.json();
      setQrToken(data.token);
      setExpiresAt(data.expiresAt);

    } catch (err: any) {
      setError(err.message);
      console.error('QR token generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loading size="lg" text="Yükleniyor..." /></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
          Tek Kullanımlık QR Kod
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Güvenli ve anlık erişim için geçici bir QR kod oluşturun.
        </p>
      </div>

      <div className="max-w-sm mx-auto flex flex-col items-center">
        {/* QR Kodu Görüntüleme Alanı */}
        <div className="w-full aspect-square bg-gray-900/50 rounded-xl cyber-border-soft flex items-center justify-center mb-6 p-4">
          {isLoading ? (
            <Loading text="Token oluşturuluyor..." />
          ) : qrToken ? (
            <div className="p-4 bg-white rounded-lg">
                <ClientQRGenerator value={qrToken} size={256} />
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-5xl mb-4">👇</div>
              <p>Başlamak için butona tıklayın</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 w-full text-center">
            {error}
          </div>
        )}

        {expiresAt && !isLoading && (
            <div className="bg-blue-900/20 border border-blue-500 text-blue-300 p-3 rounded-lg mb-4 w-full text-center text-sm">
                Bu QR kod {new Date(expiresAt).toLocaleTimeString()} tarihine kadar geçerlidir.
            </div>
        )}

        <NeonButton
          onClick={generateSingleUseToken}
          disabled={isLoading}
          variant="primary"
          size="lg"
          glow
          className="w-full"
        >
          {isLoading ? 'Oluşturuluyor...' : 'Yeni QR Kod Oluştur'}
        </NeonButton>

        <div className="text-center mt-8 glass-effect p-4 rounded-xl w-full">
            <h3 className="font-bold text-teal-300 mb-2">Nasıl Çalışır?</h3>
            <p className="text-xs text-gray-300">
                Bu buton, 5 dakika geçerli olan, tamamen rastgele ve tek kullanımlık bir QR kod üretir. Kod tarandığında, sistem sizi tanır ve gerekli işlemi yapar. Süresi dolan veya kullanılan kodlar geçersiz olur.
            </p>
        </div>
      </div>
    </div>
  );
}