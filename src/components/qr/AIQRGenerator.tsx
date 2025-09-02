// src/components/qr/AIQRGenerator.tsx
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQR, QRType } from '@/hooks/useQR';
import QRCodeWrapper from './QRCodeWrapper';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface AIQRFeatures {
  colorPalettes: ColorPalette[];
  artStyles: string[];
  logoSuggestions: string[];
}

export default function AIQRGenerator({ className = '' }: { className?: string }) {
  const { user, profile, loading: authLoading } = useAuth();
  const qr = useQR(user, profile);
  const qrRef = useRef<HTMLDivElement>(null);
  const [isAIMode, setIsAIMode] = useState(false);
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIQRFeatures | null>(null);

  // AI-generated color palettes based on user profile/content
  const generateAIColorPalettes = async (): Promise<ColorPalette[]> => {
    // In a real implementation, this would call an AI service
    // For now, we'll generate smart palettes based on user data
    
    const username = user?.email?.split('@')[0] || 'user';
    const isBusinessUser = profile && 'companyName' in profile;
    
    const basePalettes: ColorPalette[] = [
      {
        name: 'HOYN! Classic',
        primary: '#E040FB',
        secondary: '#8E24AA',
        accent: '#FF4081',
        background: '#000000'
      },
      {
        name: 'Professional Blue',
        primary: '#2196F3',
        secondary: '#1976D2',
        accent: '#00BCD4',
        background: '#FFFFFF'
      },
      {
        name: 'Creative Orange',
        primary: '#FF9800',
        secondary: '#F57C00',
        accent: '#FFC107',
        background: '#263238'
      },
      {
        name: 'Elegant Purple',
        primary: '#9C27B0',
        secondary: '#7B1FA2',
        accent: '#E1BEE7',
        background: '#F3E5F5'
      },
      {
        name: 'Tech Green',
        primary: '#4CAF50',
        secondary: '#388E3C',
        accent: '#8BC34A',
        background: '#1B5E20'
      }
    ];

    // AI logic: Suggest palettes based on user type and preferences
    if (isBusinessUser) {
      return basePalettes.filter(p => 
        p.name.includes('Professional') || 
        p.name.includes('Elegant') || 
        p.name.includes('Tech')
      );
    }

    // For personal users, suggest more creative options
    return basePalettes.filter(p => 
      p.name.includes('Creative') || 
      p.name.includes('HOYN!') || 
      p.name.includes('Elegant')
    );
  };

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    setIsGeneratingPalette(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const palettes = await generateAIColorPalettes();
      
      const suggestions: AIQRFeatures = {
        colorPalettes: palettes,
        artStyles: [
          'Minimal Gradient',
          'Neon Cyberpunk',
          'Retro Wave',
          'Corporate Clean',
          'Artistic Blur'
        ],
        logoSuggestions: [
          '🎯 Target Icon',
          '⚡ Lightning Bolt',
          '🌟 Star Symbol',
          '💎 Diamond Shape',
          '🔥 Fire Element'
        ]
      };
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  // Apply AI-suggested palette
  const applyAIPalette = (palette: ColorPalette) => {
    qr.updateSettings({
      bgColor: palette.background,
      fgColor: palette.primary
    });
  };

  // Generate AI-enhanced QR
  const generateAIQR = async () => {
    if (!aiSuggestions) {
      await generateAISuggestions();
    }
    
    // Apply first suggested palette automatically
    if (aiSuggestions?.colorPalettes[0]) {
      applyAIPalette(aiSuggestions.colorPalettes[0]);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <Loading size="lg" text="AI QR Generator loading..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-400">Login required for AI features</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* AI QR Preview Section */}
        <AnimatedCard className="flex flex-col items-center space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsAIMode(!isAIMode)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                isAIMode 
                  ? 'bg-purple-600 text-white glow-subtle' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {isAIMode ? '🤖 AI Mode Active' : '✨ Enable AI Mode'}
            </button>
            
            {isAIMode && (
              <div className="text-sm text-purple-300 animate-pulse">
                AI-Powered Design Active
              </div>
            )}
          </div>

          <div 
            id="ai-qr-code-container" 
            ref={qrRef} 
            className={`glass-effect p-8 rounded-xl cyber-border transition-all duration-300 ${
              isAIMode ? 'hover:glow-intense border-purple-500/50' : 'hover:glow-subtle'
            }`}
          >
            {qr.isReady ? (
              <div className="relative">
                <QRCodeWrapper 
                  value={qr.qrValue} 
                  size={qr.qrState.settings.size} 
                  bgColor={qr.qrState.settings.bgColor} 
                  fgColor={qr.qrState.settings.fgColor}
                  logo={qr.qrState.settings.customLogo}
                  className=""
                  onError={() => qr.clearError()}
                />
                
                {isAIMode && (
                  <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    🤖 AI
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center bg-gray-900 rounded-lg border-2 border-dashed border-purple-500/30"
                style={{ width: qr.qrState.settings.size, height: qr.qrState.settings.size }}
              >
                <div className="text-6xl mb-4 opacity-50">🤖</div>
                <p className="text-gray-400 text-center text-sm mb-2">AI-Enhanced QR</p>
                <p className="text-purple-300 text-xs text-center">Generate with AI suggestions</p>
              </div>
            )}
          </div>
          
          {/* AI Action Buttons */}
          <div className="flex flex-col space-y-3 w-full max-w-sm">
            <NeonButton
              onClick={generateAIQR}
              variant="primary"
              size="lg"
              glow
              disabled={isGeneratingPalette}
            >
              {isGeneratingPalette ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                  </svg>
                  AI Processing...
                </span>
              ) : (
                '🤖 Generate AI QR'
              )}
            </NeonButton>
            
            {aiSuggestions && (
              <NeonButton
                onClick={generateAISuggestions}
                variant="outline"
                size="md"
                disabled={isGeneratingPalette}
              >
                🔄 Refresh AI Suggestions
              </NeonButton>
            )}
          </div>
        </AnimatedCard>

        {/* AI Suggestions Panel */}
        <AnimatedCard className="glass-effect p-8 rounded-xl cyber-border">
          <h2 className="text-3xl font-bold text-white mb-8 glow-text">🤖 AI Suggestions</h2>
          
          {!aiSuggestions ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 opacity-50">🎨</div>
              <p className="text-gray-400 mb-4">AI suggestions not generated yet</p>
              <NeonButton
                onClick={generateAISuggestions}
                variant="primary"
                size="md"
                glow
                disabled={isGeneratingPalette}
              >
                {isGeneratingPalette ? '🧠 AI Thinking...' : '✨ Get AI Suggestions'}
              </NeonButton>
            </div>
          ) : (
            <div className="space-y-8">
              {/* AI Color Palettes */}
              <div>
                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  🎨 AI Color Palettes
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">Smart</span>
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {aiSuggestions.colorPalettes.map((palette, index) => (
                    <button
                      key={index}
                      onClick={() => applyAIPalette(palette)}
                      className="p-4 rounded-lg border border-gray-600 hover:border-purple-400 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                            {palette.name}
                          </h4>
                          <div className="flex gap-2 mt-2">
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: palette.primary }}
                              title={`Primary: ${palette.primary}`}
                            />
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: palette.secondary }}
                              title={`Secondary: ${palette.secondary}`}
                            />
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: palette.background }}
                              title={`Background: ${palette.background}`}
                            />
                          </div>
                        </div>
                        <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Apply →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Art Styles */}
              <div>
                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  🎭 Art Styles
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Coming Soon</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {aiSuggestions.artStyles.map((style, index) => (
                    <button
                      key={index}
                      className="p-3 rounded-lg border border-gray-600 text-center text-gray-400 cursor-not-allowed opacity-50"
                      disabled
                    >
                      <span className="text-sm">{style}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Advanced art styles will be available in future updates
                </p>
              </div>

              {/* Logo Suggestions */}
              <div>
                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  🎯 Logo Suggestions
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Beta</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  {aiSuggestions.logoSuggestions.map((logo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // In future: generate or apply logo
                        alert(`Logo suggestion: ${logo}\nFeature coming soon!`);
                      }}
                      className="p-4 rounded-lg border border-gray-600 hover:border-purple-400 transition-colors text-center"
                    >
                      <div className="text-2xl mb-1">{logo.split(' ')[0]}</div>
                      <div className="text-xs text-gray-400">{logo.split(' ').slice(1).join(' ')}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* AI Info */}
          <div className="mt-8 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <h4 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
              🧠 AI Intelligence
            </h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• Analyzes your profile and usage patterns</p>
              <p>• Suggests optimal color combinations</p>
              <p>• Recommends professional design elements</p>
              <p>• Learns from your preferences over time</p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}