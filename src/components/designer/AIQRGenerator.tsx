// src/components/designer/AIQRGenerator.tsx
'use client';

import { useState } from 'react';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface AIQRGeneratorProps {
  userQRCode: string;
  onGenerated: (imageUrl: string) => void;
  onClose: () => void;
}

export default function AIQRGenerator({ userQRCode, onGenerated, onClose }: AIQRGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string>('');

  // Turkish prompt templates
  const promptTemplates = [
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      icon: '⚡',
      prompt: 'cyberpunk neon ışıklı QR kod, elektrik mavisi ve mor renkler, gelecekçi tasarım, yüksek teknoloji atmosferi',
      description: 'Gelecekçi neon ışıklar ve cyberpunk atmosferi'
    },
    {
      id: 'nature',
      name: 'Doğa Teması',
      icon: '🌿',
      prompt: 'doğal QR kod tasarımı, yeşil yapraklar, çiçekler, organik formlar, doğa ile uyumlu',
      description: 'Yeşil doğa ve organik desenler'
    },
    {
      id: 'abstract',
      name: 'Soyut Sanat',
      icon: '🎨',
      prompt: 'soyut sanat QR kod, renkli geometrik şekiller, modern sanat, minimalist tasarım',
      description: 'Modern soyut sanat ve geometrik formlar'
    },
    {
      id: 'space',
      name: 'Uzay Teması',
      icon: '🚀',
      prompt: 'uzay temalı QR kod, yıldızlar, galaksiler, kozmik renkler, astronot atmosferi',
      description: 'Galaksi, yıldızlar ve uzay atmosferi'
    },
    {
      id: 'fire',
      name: 'Ateş ve Alev',
      icon: '🔥',
      prompt: 'ateş ve alev temalı QR kod, sıcak renkler, turuncu kırmızı alevler, dinamik hareket',
      description: 'Dinamik alevler ve sıcak tonlar'
    },
    {
      id: 'water',
      name: 'Su ve Dalga',
      icon: '🌊',
      prompt: 'su ve dalga temalı QR kod, mavi tonlar, akışkan formlar, sakinleştirici atmosfer',
      description: 'Mavi tonlar ve akışkan su dalgaları'
    },
    {
      id: 'gold',
      name: 'Altın Lüks',
      icon: '✨',
      prompt: 'lüks altın QR kod, altın renkler, kristal detaylar, premium tasarım, değerli görünüm',
      description: 'Altın tonlar ve lüks premium görünüm'
    },
    {
      id: 'retro',
      name: 'Retro 80s',
      icon: '📺',
      prompt: '80s retro QR kod, neon pembe mor renkler, synthwave atmosferi, nostaljik tasarım',
      description: 'Nostaljik 80s neon ve synthwave'
    }
  ];

  // AI QR Art generation function
  const generateAIQR = async () => {
    if (!prompt.trim() && !selectedStyle) {
      alert('Lütfen bir stil seçin veya prompt girin!');
      return;
    }

    setIsGenerating(true);

    try {
      // Use the selected template prompt or custom prompt
      const finalPrompt = selectedStyle 
        ? promptTemplates.find(t => t.id === selectedStyle)?.prompt || prompt
        : prompt;

      // Option 1: Use real Hugging Face API (uncomment when ready)
      // await generateWithHuggingFace(finalPrompt);
      
      // Option 2: Demo simulation (current)
      await simulateAIGeneration(finalPrompt);
      
    } catch (error) {
      console.error('AI QR generation failed:', error);
      alert('AI QR kod oluşturma başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Real Hugging Face API integration
  const generateWithHuggingFace = async (finalPrompt: string) => {
    const response = await fetch('/api/generate-qr-art', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        qr_code_content: userQRCode,
        num_inference_steps: 20,
        guidance_scale: 7.5,
        controlnet_conditioning_scale: 1.1,
        seed: Math.floor(Math.random() * 1000000)
      }),
    });
    
    if (!response.ok) {
      throw new Error('AI generation failed');
    }
    
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    setGeneratedImage(imageUrl);
  };

  // Simulate AI generation (replace with real API call)
  const simulateAIGeneration = async (finalPrompt: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For demo, create a data URL with artistic QR-like pattern
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 400;
    
    if (ctx) {
      // Create artistic QR background based on style
      const gradient = ctx.createLinearGradient(0, 0, 400, 400);
      
      if (selectedStyle === 'cyberpunk') {
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#ff00ff');
      } else if (selectedStyle === 'nature') {
        gradient.addColorStop(0, '#1a4a1a');
        gradient.addColorStop(0.5, '#4a7c59');
        gradient.addColorStop(1, '#a8e6cf');
      } else if (selectedStyle === 'fire') {
        gradient.addColorStop(0, '#ff4400');
        gradient.addColorStop(0.5, '#ff8800');
        gradient.addColorStop(1, '#ffaa00');
      } else {
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(0.5, '#6600cc');
        gradient.addColorStop(1, '#cc00ff');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);
      
      // Add artistic QR pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const qrSize = 20;
      for (let x = 0; x < 400; x += qrSize) {
        for (let y = 0; y < 400; y += qrSize) {
          if (Math.random() > 0.5) {
            ctx.fillRect(x, y, qrSize - 2, qrSize - 2);
          }
        }
      }
      
      // Add center pattern (typical QR finder pattern)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(50, 50, 80, 80);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(60, 60, 60, 60);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(70, 70, 40, 40);
      
      // Repeat for other corners
      const positions = [[270, 50], [50, 270]];
      positions.forEach(([x, y]) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, 80, 80);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(x + 10, y + 10, 60, 60);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(x + 20, y + 20, 40, 40);
      });
    }
    
    const imageUrl = canvas.toDataURL('image/png');
    setGeneratedImage(imageUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatedCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="glass-effect p-6 rounded-xl cyber-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white glow-text">
              🎨 AI QR Sanat Üretici
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ×
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - Controls */}
            <div className="space-y-6">
              {/* Style Templates */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">🎭 Hazır Stiller</h3>
                <div className="grid grid-cols-2 gap-3">
                  {promptTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedStyle(template.id);
                        setPrompt(template.prompt);
                      }}
                      className={`glass-effect p-4 rounded-lg cyber-border transition-all text-left group hover:glow-subtle ${
                        selectedStyle === template.id ? 'glow-intense border-purple-400' : ''
                      }`}
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                        {template.icon}
                      </div>
                      <div className="text-sm font-bold text-white">{template.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">✍️ Özel Prompt</h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Kendi QR sanat tanımınızı yazın...

Örnekler:
- 'mavi kristal QR kod, buzlu atmosfer'
- 'pembe çiçekli romantik QR tasarımı'
- 'siyah altın lüks premium QR kod'
- 'renkli gökkuşağı temalı QR sanatı'"
                  className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 h-32 resize-none text-sm"
                />
              </div>

              {/* Generation Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">QR İçerik:</span>
                  <code className="text-xs bg-gray-900 px-2 py-1 rounded text-green-400">
                    {userQRCode.substring(0, 30)}...
                  </code>
                </div>

                <NeonButton
                  onClick={generateAIQR}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isGenerating || (!prompt.trim() && !selectedStyle)}
                  glow={!isGenerating}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                      </svg>
                      AI QR Sanatı Üretiliyor...
                    </span>
                  ) : (
                    '🚀 AI QR Sanatı Oluştur'
                  )}
                </NeonButton>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">👁️ Önizleme</h3>
              <div className="aspect-square bg-gray-900 rounded-lg border-2 border-gray-600 flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">AI sanat üretiliyor...</p>
                  </div>
                ) : generatedImage ? (
                  <div className="w-full h-full p-4">
                    <img 
                      src={generatedImage} 
                      alt="Generated AI QR Art"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <div className="mt-4 flex gap-3">
                      <NeonButton
                        onClick={() => onGenerated(generatedImage)}
                        variant="primary"
                        size="md"
                        className="flex-1"
                        glow
                      >
                        ✅ Tasarıma Ekle
                      </NeonButton>
                      <NeonButton
                        onClick={() => {
                          const link = document.createElement('a');
                          link.download = 'hoyn-ai-qr-art.png';
                          link.href = generatedImage;
                          link.click();
                        }}
                        variant="outline"
                        size="md"
                      >
                        📥 İndir
                      </NeonButton>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🎨</div>
                    <p>AI QR sanatınız burada görünecek</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
            <h4 className="text-sm font-bold text-purple-300 mb-2">💡 İpuçları:</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Renk isimleri kullanın: "mavi", "altın", "yeşil"</li>
              <li>• Materyal tanımları: "kristal", "metal", "cam", "alevler"</li>
              <li>• Atmosfer: "gelecekçi", "retro", "doğal", "lüks"</li>
              <li>• En iyi sonuç için hazır stilleri deneyin</li>
            </ul>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}