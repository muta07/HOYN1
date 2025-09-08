// src/app/dashboard/business-profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { BusinessProfile } from '@/lib/firebase';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function BusinessProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form states
  const [formData, setFormData] = useState({
    companyName: '',
    nickname: '',
    description: '',
    businessType: '',
    sector: '',
    foundedYear: '',
    employeeCount: '',
    phone: '',
    email2: '',
    whatsapp: '',
    website: '',
    address: '',
    city: '',
    district: '',
    country: 'Türkiye',
    instagram: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    services: [] as string[],
    workingHours: {
      monday: '', tuesday: '', wednesday: '', thursday: '',
      friday: '', saturday: '', sunday: ''
    },
    businessSettings: {
      showEmployeeCount: true,
      showFoundedYear: true,
      showWorkingHours: true,
      allowDirectMessages: true,
      showLocation: true
    }
  });

  const [newService, setNewService] = useState('');

  const businessTypes = [
    'Restoran/Kafe', 'Mağaza/Perakende', 'Kuaför/Güzellik', 'Spor Salonu',
    'Eğitim/Kurs', 'Sağlık/Klinik', 'Teknoloji', 'Danışmanlık', 'Diğer'
  ];

  const sectors = [
    'Teknoloji', 'Sağlık', 'Eğitim', 'Perakende', 'Gıda & İçecek',
    'Turizm & Otelcilik', 'Emlak', 'Otomotiv', 'Finans & Bankacılık', 'Diğer'
  ];

  const employeeCounts = ['1-5 kişi', '6-10 kişi', '11-25 kişi', '26-50 kişi', '51-100 kişi', '100+ kişi'];

  const tabs = [
    { id: 'basic', name: 'Temel Bilgiler', icon: '🏢' },
    { id: 'contact', name: 'İletişim', icon: '📞' },
    { id: 'social', name: 'Sosyal Medya', icon: '📱' },
    { id: 'services', name: 'Hizmetler', icon: '⚙️' },
    { id: 'settings', name: 'Ayarlar', icon: '🔧' }
  ];

  // Load existing data
  useEffect(() => {
    if (user && profile) {
      const bp = profile as BusinessProfile;
      setFormData({
        companyName: bp.businessName || '',  // Changed from companyName to businessName
        nickname: bp.nickname || '',
        description: bp.description || '',
        businessType: bp.businessType || '',
        sector: bp.sector || '',
        foundedYear: bp.foundedYear?.toString() || '',
        employeeCount: bp.employeeCount || '',
        phone: bp.phone || '',
        email2: bp.contactInfo?.email2 || '',
        whatsapp: bp.contactInfo?.whatsapp || '',
        website: bp.website || '',
        address: bp.address || '',
        city: bp.location?.city || '',
        district: bp.location?.district || '',
        country: bp.location?.country || 'Türkiye',
        instagram: bp.socialMedia?.instagram || '',
        facebook: bp.socialMedia?.facebook || '',
        twitter: bp.socialMedia?.twitter || '',
        linkedin: bp.socialMedia?.linkedin || '',
        services: bp.services || [],
        workingHours: {
          monday: bp.workingHours?.monday || '',
          tuesday: bp.workingHours?.tuesday || '',
          wednesday: bp.workingHours?.wednesday || '',
          thursday: bp.workingHours?.thursday || '',
          friday: bp.workingHours?.friday || '',
          saturday: bp.workingHours?.saturday || '',
          sunday: bp.workingHours?.sunday || ''
        },
        businessSettings: {
          showEmployeeCount: bp.businessSettings?.showEmployeeCount ?? true,
          showFoundedYear: bp.businessSettings?.showFoundedYear ?? true,
          showWorkingHours: bp.businessSettings?.showWorkingHours ?? true,
          allowDirectMessages: bp.businessSettings?.allowDirectMessages ?? true,
          showLocation: bp.businessSettings?.showLocation ?? true
        }
      });
    }
  }, [user, profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      updateFormData('services', [...formData.services, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    updateFormData('services', formData.services.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;

    // Check if Firebase is initialized
    if (!db) {
      alert('Firebase başlatılmadı. Lütfen daha sonra tekrar deneyin.');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const updateData = {
        businessName: formData.companyName,  // Changed from companyName to businessName
        nickname: formData.nickname || formData.companyName,
        description: formData.description,
        businessType: formData.businessType,
        sector: formData.sector,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
        employeeCount: formData.employeeCount,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        services: formData.services,
        workingHours: formData.workingHours,
        socialMedia: {
          instagram: formData.instagram,
          facebook: formData.facebook,
          twitter: formData.twitter,
          linkedin: formData.linkedin
        },
        contactInfo: {
          whatsapp: formData.whatsapp,
          email2: formData.email2
        },
        location: {
          city: formData.city,
          district: formData.district,
          country: formData.country
        },
        businessSettings: formData.businessSettings,
        updatedAt: new Date()
      };

      await updateDoc(userRef, updateData);
      alert('İşletme profili başarıyla güncellendi! ✨');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Profil güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-orbitron mb-4 glow-text">
            🏢 İşletme Profili
          </h1>
          <p className="text-xl text-gray-300 mb-2">İşletme bilgilerinizi yönetin</p>
          <p className="text-purple-300">Müşterilerinizin sizi daha iyi tanıması için profil bilgilerinizi tamamlayın</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AnimatedCard className="sticky top-6">
              <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
                <h3 className="text-lg font-bold text-white mb-4">Profil Bölümleri</h3>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-purple-900/50 border border-purple-500/30 text-purple-300'
                          : 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white'
                      }`}
                    >
                      <span className="mr-3">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </AnimatedCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatedCard>
              <div className="bg-gray-900 p-8 rounded-xl border border-purple-900">
                
                {/* Basic Information */}
                {activeTab === 'basic' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      🏢 Temel Bilgiler
                    </h2>
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Şirket/İşletme Adı <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => updateFormData('companyName', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="ABC Restoran"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">
                            <span className="font-bold">Takma Ad (Marka Adı)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.nickname}
                            onChange={(e) => updateFormData('nickname', e.target.value)}
                            className="w-full p-3 bg-purple-900/20 border border-purple-500/50 rounded-lg text-white"
                            placeholder={formData.companyName || 'ABC, Restaurant ABC, vs...'}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">İşletme Türü</label>
                          <select
                            value={formData.businessType}
                            onChange={(e) => updateFormData('businessType', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          >
                            <option value="">Seçin</option>
                            {businessTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Sektör</label>
                          <select
                            value={formData.sector}
                            onChange={(e) => updateFormData('sector', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          >
                            <option value="">Seçin</option>
                            {sectors.map(sector => (
                              <option key={sector} value={sector}>{sector}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Çalışan Sayısı</label>
                          <select
                            value={formData.employeeCount}
                            onChange={(e) => updateFormData('employeeCount', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          >
                            <option value="">Seçin</option>
                            {employeeCounts.map(count => (
                              <option key={count} value={count}>{count}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Kuruluş Yılı</label>
                          <input
                            type="number"
                            value={formData.foundedYear}
                            onChange={(e) => updateFormData('foundedYear', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="2023"
                            min="1900"
                            max={new Date().getFullYear()}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Şehir</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => updateFormData('city', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="İstanbul"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">İşletme Açıklaması</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => updateFormData('description', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                          placeholder="İşletmenizi tanıtan kısa bir açıklama yazın..."
                          maxLength={500}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                          {formData.description.length}/500 karakter
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {activeTab === 'contact' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      📞 İletişim Bilgileri
                    </h2>
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Telefon</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => updateFormData('phone', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="+90 555 123 45 67"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
                          <input
                            type="tel"
                            value={formData.whatsapp}
                            onChange={(e) => updateFormData('whatsapp', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="+90 555 123 45 67"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => updateFormData('website', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="https://www.sirket.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">İkinci Email</label>
                          <input
                            type="email"
                            value={formData.email2}
                            onChange={(e) => updateFormData('email2', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="info@sirket.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Adres</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => updateFormData('address', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white h-20"
                          placeholder="Tam adres bilgisi..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media */}
                {activeTab === 'social' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      📱 Sosyal Medya Hesapları
                    </h2>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Instagram (@)</label>
                          <input
                            type="text"
                            value={formData.instagram}
                            onChange={(e) => updateFormData('instagram', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="kullaniciadi"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Facebook</label>
                          <input
                            type="text"
                            value={formData.facebook}
                            onChange={(e) => updateFormData('facebook', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="sayfaadi"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Twitter / X (@)</label>
                          <input
                            type="text"
                            value={formData.twitter}
                            onChange={(e) => updateFormData('twitter', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="kullaniciadi"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn</label>
                          <input
                            type="text"
                            value={formData.linkedin}
                            onChange={(e) => updateFormData('linkedin', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="sirket-adi"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Services */}
                {activeTab === 'services' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      ⚙️ Sunduğunuz Hizmetler
                    </h2>
                    <div className="space-y-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newService}
                          onChange={(e) => setNewService(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addService()}
                          className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          placeholder="Yeni hizmet ekle..."
                        />
                        <NeonButton onClick={addService} variant="primary" size="md">
                          ➕ Ekle
                        </NeonButton>
                      </div>

                      <div className="grid md:grid-cols-2 gap-2">
                        {formData.services.map((service, index) => (
                          <div key={index} className="flex items-center gap-2 bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
                            <span className="flex-1 text-white">{service}</span>
                            <button
                              onClick={() => removeService(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      {formData.services.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          Henüz hizmet eklenmemiş. Yukarıdaki alandan hizmet ekleyebilirsiniz.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Settings */}
                {activeTab === 'settings' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      🔧 Profil Görünüm Ayarları
                    </h2>
                    <div className="space-y-4">
                      {Object.entries({
                        showEmployeeCount: 'Çalışan sayısını göster',
                        showFoundedYear: 'Kuruluş yılını göster',
                        showWorkingHours: 'Çalışma saatlerini göster',
                        allowDirectMessages: 'Doğrudan mesaj almaya izin ver',
                        showLocation: 'Konum bilgilerini göster'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                          <span className="text-white">{label}</span>
                          <button
                            onClick={() => updateFormData('businessSettings', {
                              ...formData.businessSettings,
                              [key]: !formData.businessSettings[key as keyof typeof formData.businessSettings]
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.businessSettings[key as keyof typeof formData.businessSettings] 
                                ? 'bg-purple-600' 
                                : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.businessSettings[key as keyof typeof formData.businessSettings] 
                                  ? 'translate-x-6' 
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* QR Code Button */}
                <div className="mt-6">
                  <NeonButton
                    onClick={() => router.push('/dashboard/qr-generator')}
                    variant="primary"
                    size="lg"
                    glow
                    className="w-full"
                  >
                    📱 İşletme QR Kodu Oluştur
                  </NeonButton>
                  <p className="text-center text-gray-400 text-sm mt-2">
                    İşletmenizin profilini paylaşmak için QR kod oluşturun
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-700">
                  <NeonButton
                    onClick={() => router.push('/dashboard')}
                    variant="outline"
                    size="lg"
                  >
                    ← Dashboard'a Dön
                  </NeonButton>
                  
                  <NeonButton
                    onClick={handleSave}
                    disabled={loading}
                    variant="primary"
                    size="lg"
                    glow
                  >
                    {loading ? 'Kaydediliyor...' : '✨ Değişiklikleri Kaydet'}
                  </NeonButton>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}