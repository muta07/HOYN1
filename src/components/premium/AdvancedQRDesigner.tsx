// src/components/premium/AdvancedQRDesigner.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { ThemedCard, ThemedButton, ThemedText } from '@/components/ui/ThemedComponents';

interface QRDesignOptions {
  color: string;
  backgroundColor: string;
  eyeColor: string;
  eyeBackgroundColor: string;
  dotStyle: 'square' | 'circle' | 'rounded';
  eyeStyle: 'square' | 'circle' | 'rounded';
  logo?: string;
  logoSize?: number;
  logoMargin?: number;
}

interface AdvancedQRDesignerProps {
  onDesignChange: (design: QRDesignOptions) => void;
  initialDesign?: QRDesignOptions;
}

export default function AdvancedQRDesigner({ 
  onDesignChange,
  initialDesign 
}: AdvancedQRDesignerProps) {
  const { hasAdvancedCustomization } = useSubscriptionFeatures();
  const [design, setDesign] = useState<QRDesignOptions>(
    initialDesign || {
      color: '#000000',
      backgroundColor: '#ffffff',
      eyeColor: '#000000',
      eyeBackgroundColor: '#ffffff',
      dotStyle: 'square',
      eyeStyle: 'square',
      logoSize: 0.2,
      logoMargin: 5
    }
  );

  useEffect(() => {
    onDesignChange(design);
  }, [design, onDesignChange]);

  const handleColorChange = (property: keyof QRDesignOptions, value: string) => {
    setDesign(prev => ({ ...prev, [property]: value }));
  };

  const handleStyleChange = (property: 'dotStyle' | 'eyeStyle', value: 'square' | 'circle' | 'rounded') => {
    setDesign(prev => ({ ...prev, [property]: value }));
  };

  if (!hasAdvancedCustomization) {
    return (
      <ThemedCard variant="default" className="p-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <ThemedText size="xl" weight="bold" className="mb-2">
          Premium Özellik
        </ThemedText>
        <ThemedText variant="muted" className="mb-4">
          QR kodunuzu özelleştirmek için Pro veya Business planına yükseltmeniz gerekiyor.
        </ThemedText>
        <ThemedButton variant="primary" size="md">
          Premium Ol
        </ThemedButton>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard variant="default" className="p-6">
      <ThemedText size="xl" weight="bold" className="mb-6">
        🎨 QR Kod Tasarımı
      </ThemedText>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colors */}
        <div>
          <ThemedText weight="bold" className="mb-3">
            Renkler
          </ThemedText>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">QR Kod Rengi</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.color}
                  onChange={(e) => handleColorChange('color', e.target.value)}
                  className="w-10 h-10 border border-gray-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-400">{design.color}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Arka Plan Rengi</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 border border-gray-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-400">{design.backgroundColor}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Göz Rengi</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.eyeColor}
                  onChange={(e) => handleColorChange('eyeColor', e.target.value)}
                  className="w-10 h-10 border border-gray-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-400">{design.eyeColor}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Göz Arka Plan Rengi</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.eyeBackgroundColor}
                  onChange={(e) => handleColorChange('eyeBackgroundColor', e.target.value)}
                  className="w-10 h-10 border border-gray-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-400">{design.eyeBackgroundColor}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Styles */}
        <div>
          <ThemedText weight="bold" className="mb-3">
            Stiller
          </ThemedText>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Nokta Stili</label>
              <div className="flex gap-2">
                {(['square', 'circle', 'rounded'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleStyleChange('dotStyle', style)}
                    className={`flex-1 p-2 border rounded ${
                      design.dotStyle === style
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {style === 'square' && 'Kare'}
                    {style === 'circle' && 'Yuvarlak'}
                    {style === 'rounded' && 'Yuvarlatılmış'}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Göz Stili</label>
              <div className="flex gap-2">
                {(['square', 'circle', 'rounded'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleStyleChange('eyeStyle', style)}
                    className={`flex-1 p-2 border rounded ${
                      design.eyeStyle === style
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {style === 'square' && 'Kare'}
                    {style === 'circle' && 'Yuvarlak'}
                    {style === 'rounded' && 'Yuvarlatılmış'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Logo Upload */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Logo (İsteğe Bağlı)</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    // In a real implementation, this would upload the file
                    // and set the logo URL in the design
                    if (e.target.files && e.target.files[0]) {
                      alert('Logo yükleme özelliği şu anda demo modunda. Gerçek uygulamada logo yüklenecektir.');
                    }
                  }}
                  className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-900 file:text-white hover:file:bg-purple-800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <ThemedButton
          onClick={() => {
            // Reset to default design
            const defaultDesign: QRDesignOptions = {
              color: '#000000',
              backgroundColor: '#ffffff',
              eyeColor: '#000000',
              eyeBackgroundColor: '#ffffff',
              dotStyle: 'square',
              eyeStyle: 'square',
              logoSize: 0.2,
              logoMargin: 5
            };
            setDesign(defaultDesign);
          }}
          variant="outline"
          size="sm"
        >
          Varsayılanlara Dön
        </ThemedButton>
      </div>
    </ThemedCard>
  );
}