'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateHOYNProfile } from '@/lib/firebase'; // Merkezi güncelleme fonksiyonu
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

// Bu sayfa artık kullanılmıyor, /dashboard/profile sayfasına yönlendirildi.
// Ancak build hatasını önlemek için geçici bir düzeltme yapılıyor.

export default function BusinessProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Bu sayfa artık doğrudan kullanılmadığı için kullanıcıyı ana profil sayfasına yönlendir.
    // Bu, hem kod tekrarını önler hem de tek bir merkezi profil yönetim sayfası olmasını sağlar.
    router.push('/dashboard/profile');
  }, [router]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Yönlendiriliyor..." />
      </div>
    );
  }

  // Yönlendirme gerçekleşene kadar boş bir içerik göster
  return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Profil sayfanıza yönlendiriliyorsunuz..." />
      </div>
  );

  /*
  // Eski kodun build hatası vermemesi için yorum satırına alındı.
  // Tip hatasını ve kaydetme mantığını düzeltmek yerine, bu sayfanın sorumluluğunu
  // zaten bu işi daha iyi yapan /dashboard/profile sayfasına devrettik.

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user && profile) {
      if (profile.type === 'business') {
        // Artık `profile` nesnesinin `business` tipinde olduğu biliniyor.
        const bp = profile;
        setFormData({
          companyName: bp.companyName || '',
          // ... diğer tüm alanlar
        });
      } 
    }
  }, [user, profile]);

  if (profile && profile.type !== 'business') {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white p-4 text-center">
            <div>
                <h1 className='text-2xl font-bold text-red-400'>Hatalı Profil Tipi</h1>
                <p className='text-gray-300 mt-2'>Bu sayfa sadece işletme profillerini düzenlemek içindir.</p>
                <NeonButton className='mt-4' onClick={() => router.push('/dashboard/profile')}>Kişisel Profilime Git</NeonButton>
            </div>
        </div>
    );
  }
  */
}
