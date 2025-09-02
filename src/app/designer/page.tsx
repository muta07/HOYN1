// src/app/designer/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProductGrid, { Product } from '@/components/designer/ProductGrid';
import DesignCanvas from '@/components/designer/DesignCanvas';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';
import NeonButton from '@/components/ui/NeonButton';
import { generateHOYNQR } from '@/lib/qr-utils';

export default function DesignerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userQRCode, setUserQRCode] = useState<string>('');

  // Get username
  const username = user?.displayName || 
    (user?.email ? user.email.split('@')[0] : 'kullanici');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (username) {
      const qrValue = generateHOYNQR(username, 'profile');
      setUserQRCode(qrValue);
    }
  }, [username]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Designer yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  // If product is selected, show design canvas
  if (selectedProduct) {
    return (
      <DesignCanvas 
        product={selectedProduct}
        onBack={handleBackToProducts}
        userQRCode={userQRCode}
      />
    );
  }

  // Show product selection
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedCard direction="scale" delay={0}>
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black glow-text font-orbitron mb-4 float
                           bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              🎨 Tasarım Merkezi
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              QR kodunu istediğin ürüne yerleştir, dünyaya göster!
            </p>
            <p className="text-purple-300">
              Kullanıcı: <span className="font-bold text-white">{username}</span> | 
              QR: <span className="font-mono text-sm">{userQRCode.substring(0, 30)}...</span>
            </p>
          </div>
        </AnimatedCard>

        {/* Features */}
        <AnimatedCard direction="up" delay={200}>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="glass-effect p-6 rounded-xl cyber-border text-center hover:glow-subtle transition-all">
              <div className="text-4xl mb-3">🖱️</div>
              <h3 className="text-lg font-bold text-white mb-2">Sürükle & Bırak</h3>
              <p className="text-gray-400 text-sm">QR kodunu ve metinleri istediğin yere yerleştir</p>
            </div>
            
            <div className="glass-effect p-6 rounded-xl cyber-border text-center hover:glow-subtle transition-all">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-lg font-bold text-white mb-2">AI Tasarım</h3>
              <p className="text-gray-400 text-sm">Yapay zeka ile benzersiz tasarımlar oluştur</p>
            </div>
            
            <div className="glass-effect p-6 rounded-xl cyber-border text-center hover:glow-subtle transition-all">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-lg font-bold text-white mb-2">Anında İndir</h3>
              <p className="text-gray-400 text-sm">Tasarımını PNG olarak hemen indir</p>
            </div>
          </div>
        </AnimatedCard>

        {/* QR Test Area */}
        <AnimatedCard direction="up" delay={250}>
          <div className="glass-effect p-6 rounded-xl cyber-border text-center">
            <h3 className="text-xl font-bold text-white mb-4">🔍 QR Kodu Test Et</h3>
            <p className="text-gray-400 mb-4">QR kodunu burada test edebilir, AI sanatı ile geliştirebilirsin!</p>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <NeonButton
                onClick={() => {
                  if (userQRCode) {
                    window.open(`data:text/plain,${userQRCode}`, '_blank');
                  }
                }}
                variant="outline"
                size="md"
                disabled={!userQRCode}
              >
                🔗 QR Kodu Göster
              </NeonButton>
              
              <NeonButton
                onClick={() => {
                  // Basit bir AI QR demo için test product oluştur
                  const testProduct: Product = {
                    id: 'test',
                    name: 'AI QR Test',
                    price: 'Test Mode',
                    mockupFront: '/api/placeholder/400/400',
                    colors: [{ name: 'Test', hex: '#000000' }],
                    sizes: ['Test'],
                    category: 'test',
                    description: 'AI QR sanatı test modu'
                  };
                  setSelectedProduct(testProduct);
                }}
                variant="primary"
                size="md"
                disabled={!userQRCode}
                glow
              >
                🎨 AI QR Sanat Test Et
              </NeonButton>
            </div>
            
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400">
                QR: <span className="font-mono">{userQRCode}</span>
              </p>
            </div>
          </div>
        </AnimatedCard>

        {/* Category Tabs */}
        <AnimatedCard direction="up" delay={300}>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {['all', 'T-Shirts', 'Hoodies', 'Stickers', 'Accessories', 'Mugs'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg transition-all font-medium ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white glow-subtle'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category === 'all' ? '🌟 Tümü' : 
                 category === 'T-Shirts' ? '👕 T-Shirt' :
                 category === 'Hoodies' ? '🧥 Hoodie' :
                 category === 'Stickers' ? '🏷️ Sticker' :
                 category === 'Accessories' ? '📿 Aksesuar' :
                 '☕ Kupa'}
              </button>
            ))}
          </div>
        </AnimatedCard>

        {/* Product Grid */}
        <AnimatedCard direction="up" delay={400}>
          <ProductGrid 
            onProductSelect={handleProductSelect}
            selectedCategory={selectedCategory}
          />
        </AnimatedCard>

        {/* Back to Dashboard */}
        <AnimatedCard direction="up" delay={500} className="mt-12">
          <div className="text-center">
            <NeonButton
              onClick={() => router.push('/dashboard')}
              variant="secondary"
              size="lg"
              className="min-w-[200px]"
            >
              ← Dashboard'a Dön
            </NeonButton>
          </div>
        </AnimatedCard>

        {/* Info Section */}
        <AnimatedCard direction="up" delay={600} className="mt-8">
          <div className="glass-effect p-8 rounded-xl cyber-border text-center">
            <h3 className="text-2xl font-bold text-white mb-4 glow-text">💡 Nasıl Çalışır?</h3>
            <div className="grid md:grid-cols-4 gap-6 text-gray-300">
              <div>
                <span className="text-3xl mb-2 block">1️⃣</span>
                <p className="font-bold text-white mb-1">Ürün Seç</p>
                <p className="text-sm">Tasarlamak istediğin ürünü seç</p>
              </div>
              <div>
                <span className="text-3xl mb-2 block">2️⃣</span>
                <p className="font-bold text-white mb-1">Tasarla</p>
                <p className="text-sm">QR kodunu ve metinleri yerleştir</p>
              </div>
              <div>
                <span className="text-3xl mb-2 block">3️⃣</span>
                <p className="font-bold text-white mb-1">İndir</p>
                <p className="text-sm">Tasarımını PNG olarak kaydet</p>
              </div>
              <div>
                <span className="text-3xl mb-2 block">4️⃣</span>
                <p className="font-bold text-white mb-1">Bastır</p>
                <p className="text-sm">Yerel matbaada bastır veya sipariş ver</p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}