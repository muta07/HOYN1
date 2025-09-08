// src/app/dashboard/profile-customization/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/lib/firebase';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

export default function ProfileCustomizationPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');

  const [customization, setCustomization] = useState({
    theme: 'cyberpunk',
    primaryColor: '#E040FB',
    secondaryColor: '#651FFF',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    accentColor: '#00BCD4',
    fontFamily: 'orbitron',
    borderStyle: 'cyber',
    animationStyle: 'dynamic',
    customCSS: '',
    useGradient: true,
    gradientDirection: 'to-br',
    profileLayout: 'standard',
    showCustomization: true
  });

  const themes = [
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '⚡', colors: { primary: '#E040FB', secondary: '#651FFF', bg: '#000000', accent: '#00BCD4' } },
    { id: 'neon', name: 'Neon Glow', icon: '🌟', colors: { primary: '#FF006E', secondary: '#8338EC', bg: '#0A0A0A', accent: '#00F5FF' } },
    { id: 'minimal', name: 'Minimal', icon: '⚪', colors: { primary: '#6366F1', secondary: '#4F46E5', bg: '#F8FAFC', accent: '#10B981' } },
    { id: 'dark', name: 'Dark Mode', icon: '🌙', colors: { primary: '#3B82F6', secondary: '#1D4ED8', bg: '#111827', accent: '#F59E0B' } },
    { id: 'colorful', name: 'Renkli', icon: '🌈', colors: { primary: '#F59E0B', secondary: '#EF4444', bg: '#FEF3C7', accent: '#10B981' } },
    { id: 'retro', name: 'Retro', icon: '📼', colors: { primary: '#EC4899', secondary: '#8B5CF6', bg: '#1F2937', accent: '#F97316' } }
  ];

  const tabs = [
    { id: 'theme', name: 'Tema', icon: '🎨' },
    { id: 'colors', name: 'Renkler', icon: '🌈' },
    { id: 'typography', name: 'Yazı Tipi', icon: '🔤' },
    { id: 'custom', name: 'Özel CSS', icon: '💻' },
    { id: 'preview', name: 'Önizleme', icon: '👁️' }
  ];

  // Load existing customization
  useEffect(() => {
    if (user && profile) {
      const userProfile = profile as UserProfile;
      if (userProfile.profileCustomization) {
        setCustomization({
          theme: userProfile.profileCustomization.theme || 'cyberpunk',
          primaryColor: userProfile.profileCustomization.primaryColor || '#E040FB',
          secondaryColor: userProfile.profileCustomization.secondaryColor || '#651FFF',
          backgroundColor: userProfile.profileCustomization.backgroundColor || '#000000',
          textColor: userProfile.profileCustomization.textColor || '#FFFFFF',
          accentColor: userProfile.profileCustomization.accentColor || '#00BCD4',
          fontFamily: userProfile.profileCustomization.fontFamily || 'orbitron',
          borderStyle: userProfile.profileCustomization.borderStyle || 'cyber',
          animationStyle: userProfile.profileCustomization.animationStyle || 'dynamic',
          customCSS: userProfile.profileCustomization.customCSS || '',
          useGradient: userProfile.profileCustomization.useGradient ?? true,
          gradientDirection: userProfile.profileCustomization.gradientDirection || 'to-br',
          profileLayout: userProfile.profileCustomization.profileLayout || 'standard',
          showCustomization: userProfile.profileCustomization.showCustomization ?? true
        });
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const updateCustomization = (field: string, value: any) => {
    setCustomization(prev => ({ ...prev, [field]: value }));
  };

  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCustomization(prev => ({
        ...prev,
        theme: themeId as any,
        primaryColor: theme.colors.primary,
        secondaryColor: theme.colors.secondary,
        backgroundColor: theme.colors.bg,
        accentColor: theme.colors.accent,
        textColor: theme.colors.bg === '#F8FAFC' || theme.colors.bg === '#FEF3C7' ? '#000000' : '#FFFFFF'
      }));
    }
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
      await updateDoc(userRef, {
        profileCustomization: customization,
        updatedAt: new Date()
      });
      alert('Profil özelleştirmesi başarıyla kaydedildi! ✨');
    } catch (error) {
      console.error('Customization update error:', error);
      alert('Özelleştirme kaydedilirken hata oluştu.');
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
            🎨 Profil Özelleştirme
          </h1>
          <p className="text-xl text-gray-300 mb-2">Profilini tamamen kendine göre tasarla</p>
          <p className="text-purple-300">Tema, renkler, yazı tipleri ve daha fazlasını özelleştir</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AnimatedCard className="sticky top-6">
              <div className="bg-gray-900 p-6 rounded-xl border border-purple-900">
                <h3 className="text-lg font-bold text-white mb-4">Özelleştirme</h3>
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
                
                {/* Theme Selection */}
                {activeTab === 'theme' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">🎨 Tema Seçimi</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => applyTheme(theme.id)}
                          className={`p-6 rounded-lg border-2 transition-all text-left ${
                            customization.theme === theme.id
                              ? 'border-purple-500 bg-purple-900/30 glow-subtle'
                              : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">{theme.icon}</span>
                            <h3 className="font-bold text-white">{theme.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full border border-gray-600" style={{ backgroundColor: theme.colors.primary }} />
                            <div className="w-8 h-8 rounded-full border border-gray-600" style={{ backgroundColor: theme.colors.secondary }} />
                            <div className="w-8 h-8 rounded-full border border-gray-600" style={{ backgroundColor: theme.colors.accent }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Customization */}
                {activeTab === 'colors' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">🌈 Renk Özelleştirme</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        { key: 'primaryColor', label: 'Ana Renk' },
                        { key: 'secondaryColor', label: 'İkincil Renk' },
                        { key: 'backgroundColor', label: 'Arka Plan' },
                        { key: 'accentColor', label: 'Vurgu Rengi' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="color"
                              value={customization[key as keyof typeof customization] as string}
                              onChange={(e) => updateCustomization(key, e.target.value)}
                              className="w-16 h-10 rounded-lg border border-gray-600 bg-gray-800"
                            />
                            <input
                              type="text"
                              value={customization[key as keyof typeof customization] as string}
                              onChange={(e) => updateCustomization(key, e.target.value)}
                              className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Typography */}
                {activeTab === 'typography' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">🔤 Yazı Tipi</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Font Ailesi</label>
                        <select
                          value={customization.fontFamily}
                          onChange={(e) => updateCustomization('fontFamily', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        >
                          <option value="orbitron">Orbitron (Futuristik)</option>
                          <option value="roboto">Roboto (Modern)</option>
                          <option value="inter">Inter (Temiz)</option>
                          <option value="poppins">Poppins (Dostça)</option>
                          <option value="jetbrains">JetBrains Mono (Monospace)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Çerçeve Stili</label>
                        <div className="grid md:grid-cols-4 gap-3">
                          {[
                            { id: 'sharp', name: 'Keskin', icon: '▢' },
                            { id: 'rounded', name: 'Yuvaruk', icon: '◯' },
                            { id: 'cyber', name: 'Cyber', icon: '⬟' },
                            { id: 'minimal', name: 'Minimal', icon: '▬' }
                          ].map((style) => (
                            <button
                              key={style.id}
                              onClick={() => updateCustomization('borderStyle', style.id)}
                              className={`p-3 rounded-lg border transition-all text-center ${
                                customization.borderStyle === style.id
                                  ? 'border-purple-500 bg-purple-900/30'
                                  : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                              }`}
                            >
                              <div className="text-xl mb-1">{style.icon}</div>
                              <div className="text-xs text-white">{style.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom CSS */}
                {activeTab === 'custom' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">💻 Özel CSS</h2>
                    <div className="space-y-4">
                      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-sm text-yellow-200">
                          ⚠️ Bu alan CSS bilgisi gerektiren gelişmiş kullanıcılar içindir.
                        </p>
                      </div>
                      <textarea
                        value={customization.customCSS}
                        onChange={(e) => updateCustomization('customCSS', e.target.value)}
                        className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm h-64"
                        placeholder="/* Özel CSS kodlarınızı buraya yazın */"
                      />
                    </div>
                  </div>
                )}

                {/* Preview */}
                {activeTab === 'preview' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">👁️ Önizleme</h2>
                    <div className="space-y-6">
                      <div 
                        className="p-8 rounded-xl border-2 transition-all"
                        style={{
                          backgroundColor: customization.backgroundColor,
                          borderColor: customization.primaryColor,
                          color: customization.textColor,
                          fontFamily: customization.fontFamily === 'orbitron' ? 'Orbitron' : customization.fontFamily
                        }}
                      >
                        <h3 
                          className="text-3xl font-bold mb-4"
                          style={{ color: customization.primaryColor }}
                        >
                          Örnek Profil
                        </h3>
                        <p className="mb-4">Bu, özelleştirmelerinizin nasıl görüneceğinin bir örneğidir.</p>
                        <div 
                          className="inline-block px-4 py-2 rounded-lg"
                          style={{ backgroundColor: customization.accentColor, color: customization.backgroundColor }}
                        >
                          Vurgu Örneği
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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