// src/components/designer/ProductGrid.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  mockupFront: string;
  mockupBack?: string;
  description: string;
  sizes: string[];
  colors: { name: string; hex: string; }[];
}

const PRODUCTS: Product[] = [
  {
    id: 'tshirt-basic',
    name: 'Basic T-Shirt',
    category: 'T-Shirts',
    price: '₺89',
    mockupFront: '/mockups/tshirt-front.jpg',
    mockupBack: '/mockups/tshirt-back.jpg',
    description: 'Yumuşak pamuklu basic t-shirt',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Siyah', hex: '#000000' },
      { name: 'Beyaz', hex: '#FFFFFF' },
      { name: 'Mor', hex: '#9C27B0' },
      { name: 'Lacivert', hex: '#1a237e' }
    ]
  },
  {
    id: 'hoodie-basic',
    name: 'Basic Hoodie',
    category: 'Hoodies',
    price: '₺199',
    mockupFront: '/mockups/hoodie-front.jpg',
    mockupBack: '/mockups/hoodie-back.jpg',
    description: 'Kalın, sıcak hoodie sweatshirt',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Siyah', hex: '#000000' },
      { name: 'Gri', hex: '#424242' },
      { name: 'Mor', hex: '#9C27B0' }
    ]
  },
  {
    id: 'sticker-round',
    name: 'Yuvarlak Sticker',
    category: 'Stickers',
    price: '₺25',
    mockupFront: '/mockups/sticker-round.jpg',
    description: 'Dayanıklı vinil sticker',
    sizes: ['5cm', '8cm', '10cm', '15cm'],
    colors: [
      { name: 'Beyaz', hex: '#FFFFFF' },
      { name: 'Şeffaf', hex: 'transparent' }
    ]
  },
  {
    id: 'car-sticker',
    name: 'Araba Camı Sticker',
    category: 'Stickers',
    price: '₺45',
    mockupFront: '/mockups/car-sticker.jpg',
    description: 'UV dayanımlı araba camı sticker',
    sizes: ['10x10cm', '15x15cm', '20x20cm'],
    colors: [
      { name: 'Beyaz', hex: '#FFFFFF' },
      { name: 'Siyah', hex: '#000000' }
    ]
  },
  {
    id: 'necklace-qr',
    name: 'QR Kolye',
    category: 'Accessories',
    price: '₺149',
    mockupFront: '/mockups/necklace.jpg',
    description: 'Metal QR kolye',
    sizes: ['Standard'],
    colors: [
      { name: 'Gümüş', hex: '#C0C0C0' },
      { name: 'Altın', hex: '#FFD700' },
      { name: 'Siyah', hex: '#000000' }
    ]
  },
  {
    id: 'mug-ceramic',
    name: 'Seramik Kupa',
    category: 'Mugs',
    price: '₺65',
    mockupFront: '/mockups/mug.jpg',
    description: 'Yüksek kalite seramik kupa',
    sizes: ['300ml', '400ml'],
    colors: [
      { name: 'Beyaz', hex: '#FFFFFF' },
      { name: 'Siyah', hex: '#000000' },
      { name: 'Mor', hex: '#9C27B0' }
    ]
  }
];

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
  selectedCategory?: string;
}

export default function ProductGrid({ onProductSelect, selectedCategory = 'all' }: ProductGridProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  
  const filteredProducts = selectedCategory === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map(category => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              selectedCategory === category
                ? 'bg-purple-600 text-white glow-subtle'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category === 'all' ? 'Tümü' : category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <AnimatedCard
            key={product.id}
            direction="up"
            delay={index * 100}
            className="group"
          >
            <div 
              className="glass-effect rounded-xl overflow-hidden cyber-border hover:glow-intense transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => onProductSelect(product)}
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gray-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                
                {/* Placeholder for product image */}
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <div className="text-6xl opacity-50">
                    {product.category === 'T-Shirts' && '👕'}
                    {product.category === 'Hoodies' && '🧥'}
                    {product.category === 'Stickers' && '🏷️'}
                    {product.category === 'Accessories' && '📿'}
                    {product.category === 'Mugs' && '☕'}
                  </div>
                </div>
                
                {/* Price Badge */}
                <div className="absolute top-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-lg text-sm font-bold z-20">
                  {product.price}
                </div>
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-black/70 text-purple-300 px-2 py-1 rounded-lg text-xs font-medium z-20">
                  {product.category}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {product.description}
                </p>
                
                {/* Color Options Preview */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-400">Renkler:</span>
                  <div className="flex gap-1">
                    {product.colors.slice(0, 4).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ backgroundColor: color.hex === 'transparent' ? '#f0f0f0' : color.hex }}
                        title={color.name}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-xs text-gray-400">+{product.colors.length - 4}</span>
                    )}
                  </div>
                </div>
                
                {/* Sizes Preview */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400">Bedenler:</span>
                  <span className="text-xs text-white">
                    {product.sizes.slice(0, 3).join(', ')}
                    {product.sizes.length > 3 && '...'}
                  </span>
                </div>
                
                {/* Select Button */}
                <NeonButton
                  variant={hoveredProduct === product.id ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                  glow={hoveredProduct === product.id}
                >
                  {hoveredProduct === product.id ? '🎨 Tasarlamaya Başla' : 'Seç'}
                </NeonButton>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}