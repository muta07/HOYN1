// src/app/studio/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { generateHOYNQR, generateHOYNQRWithMode } from '@/lib/qr-utils';
import { uploadUserMockup, getUserMockups, validateImageFile, formatFileSize, UploadResult } from '@/lib/storage';
import NeonButton from '@/components/ui/NeonButton';
import Loading from '@/components/ui/Loading';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface Template {
  id: string;
  name: string;
  preview: string;
  type: 'tshirt' | 'sticker' | 'helmet' | 'poster' | 'card';
  canvasWidth: number;
  canvasHeight: number;
}

interface QRPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const PRESET_TEMPLATES: Template[] = [
  {
    id: 'tshirt-basic',
    name: 'Basic T-Shirt',
    preview: '/api/placeholder/300/400',
    type: 'tshirt',
    canvasWidth: 300,
    canvasHeight: 400
  },
  {
    id: 'sticker-round',
    name: 'Round Sticker',
    preview: '/api/placeholder/200/200',
    type: 'sticker',
    canvasWidth: 200,
    canvasHeight: 200
  },
  {
    id: 'helmet-back',
    name: 'Helmet Back',
    preview: '/api/placeholder/250/300',
    type: 'helmet',
    canvasWidth: 250,
    canvasHeight: 300
  },
  {
    id: 'poster-a4',
    name: 'A4 Poster',
    preview: '/api/placeholder/210/297',
    type: 'poster',
    canvasWidth: 210,
    canvasHeight: 297
  },
  {
    id: 'business-card',
    name: 'Business Card',
    preview: '/api/placeholder/85/55',
    type: 'card',
    canvasWidth: 85,
    canvasHeight: 55
  }
];

const QR_PRESETS: { name: string; placement: QRPlacement }[] = [
  {
    name: 'Center',
    placement: { x: 50, y: 50, width: 100, height: 100, rotation: 0 }
  },
  {
    name: 'Top Left',
    placement: { x: 10, y: 10, width: 80, height: 80, rotation: 0 }
  },
  {
    name: 'Top Right',
    placement: { x: 70, y: 10, width: 80, height: 80, rotation: 0 }
  },
  {
    name: 'Bottom Center',
    placement: { x: 35, y: 70, width: 80, height: 80, rotation: 0 }
  }
];

export default function StudioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageInfo, setUploadedImageInfo] = useState<UploadResult | null>(null);
  const [userMockups, setUserMockups] = useState<UploadResult[]>([]);
  const [qrPlacement, setQrPlacement] = useState<QRPlacement>(QR_PRESETS[0].placement);
  const [userQRCode, setUserQRCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Get username for QR generation
  const username = user?.displayName || 
    (user?.email ? user.email.split('@')[0] : 'kullanici');

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Generate user QR code with mode support
  useEffect(() => {
    const generateQRWithMode = async () => {
      if (username && user) {
        try {
          // Try to generate QR with user's current mode
          const qrValue = await generateHOYNQRWithMode(username, user.uid);
          setUserQRCode(qrValue);
        } catch (error) {
          console.warn('Failed to generate QR with mode, using default:', error);
          // Fallback to default profile mode
          const qrValue = generateHOYNQR(username, 'profile', 'profile');
          setUserQRCode(qrValue);
        }
      }
    };
    
    generateQRWithMode();
  }, [username, user]);

  // Load user's existing mockups
  useEffect(() => {
    const loadUserMockups = async () => {
      if (user) {
        try {
          const mockups = await getUserMockups(user.uid);
          setUserMockups(mockups);
        } catch (error) {
          console.error('Error loading user mockups:', error);
        }
      }
    };

    loadUserMockups();
  }, [user]);

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setUploadedImage(null); // Reset uploaded image when template changes
    setQrPlacement(QR_PRESETS[0].placement); // Reset to center
  };

  // Handle image upload with Firebase Storage
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Reset previous errors
    setUploadError(null);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Firebase Storage
      const uploadResult = await uploadUserMockup(
        user.uid, 
        file, 
        (progress) => setUploadProgress(progress)
      );

      // Set as current uploaded image
      setUploadedImage(uploadResult.url);
      setUploadedImageInfo(uploadResult);
      setSelectedTemplate(null); // Clear template when uploading custom image
      
      // Refresh user mockups list
      const updatedMockups = await getUserMockups(user.uid);
      setUserMockups(updatedMockups);
      
      console.log('✅ Image uploaded successfully:', uploadResult);
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Generate and export final design
  const exportDesign = async () => {
    if (!canvasRef.current || (!selectedTemplate && !uploadedImage)) return;

    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      const template = selectedTemplate;
      if (template) {
        canvas.width = template.canvasWidth * 2; // 2x for better quality
        canvas.height = template.canvasHeight * 2;
      } else {
        canvas.width = 400;
        canvas.height = 400;
      }

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background (template or uploaded image)
      if (uploadedImage) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drawQRCode(ctx, canvas.width, canvas.height);
        };
        img.src = uploadedImage;
      } else if (template) {
        // For now, draw a simple background with template info
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Template placeholder
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // Template label
        ctx.fillStyle = '#666666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(template.name, canvas.width / 2, canvas.height / 2);
        
        drawQRCode(ctx, canvas.width, canvas.height);
      }

      // Generate download
      setTimeout(() => {
        const dataURL = canvas.toDataURL('image/png');
        setPreviewUrl(dataURL);
        
        // Auto download
        const link = document.createElement('a');
        link.download = `hoyn-design-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        setIsGenerating(false);
      }, 100);

    } catch (error) {
      console.error('Export error:', error);
      setIsGenerating(false);
    }
  };

  // Draw QR code on canvas
  const drawQRCode = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    // Calculate QR position and size based on placement percentages
    const qrX = (qrPlacement.x / 100) * canvasWidth;
    const qrY = (qrPlacement.y / 100) * canvasHeight;
    const qrWidth = (qrPlacement.width / 100) * canvasWidth;
    const qrHeight = (qrPlacement.height / 100) * canvasHeight;

    // Draw QR placeholder (in real implementation, would use QR library)
    ctx.save();
    ctx.translate(qrX + qrWidth/2, qrY + qrHeight/2);
    ctx.rotate((qrPlacement.rotation * Math.PI) / 180);
    
    // QR background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-qrWidth/2, -qrHeight/2, qrWidth, qrHeight);
    
    // QR pattern (simplified)
    ctx.fillStyle = '#000000';
    const cellSize = qrWidth / 25;
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(
            -qrWidth/2 + i * cellSize,
            -qrHeight/2 + j * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
    
    ctx.restore();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" text="Studio yükleniyor..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-purple-900/50 bg-gray-900/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold glow-text font-orbitron
                           bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎨 Design Studio
            </h1>
            <div className="text-sm text-gray-400">
              User: <span className="text-purple-300">{username}</span>
            </div>
          </div>
          <NeonButton
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="sm"
          >
            ← Dashboard
          </NeonButton>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Editor */}
        <div className="w-1/3 border-r border-purple-900/50 bg-gray-900/10 p-6 overflow-y-auto">
          <AnimatedCard direction="left" delay={0}>
            {/* Template Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span>
                Templates
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {PRESET_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedTemplate?.id === template.id
                        ? 'border-purple-500 bg-purple-900/20 glow-subtle'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-2xl">
                        {template.type === 'tshirt' ? '👕' :
                         template.type === 'sticker' ? '🏷️' :
                         template.type === 'helmet' ? '⛑️' :
                         template.type === 'poster' ? '📄' : '🎫'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{template.name}</div>
                        <div className="text-xs text-gray-400">
                          {template.canvasWidth}x{template.canvasHeight}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Custom */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📁</span>
                Upload Custom
              </h2>
              
              {/* Upload Area */}
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isUploading ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 hover:border-purple-500'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload"
                  className={`cursor-pointer block ${isUploading ? 'opacity-50' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <div className="text-4xl mb-2">⏳</div>
                      <div className="text-sm text-purple-300 mb-2">
                        Uploading... {uploadProgress}%
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📤</div>
                      <div className="text-sm text-gray-300 mb-2">
                        Click to upload your mockup
                      </div>
                      <div className="text-xs text-gray-500">
                        PNG, JPG up to 10MB
                      </div>
                    </>
                  )}
                </label>
              </div>
              
              {/* Upload Status */}
              {uploadError && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300">
                  ⚠️ {uploadError}
                </div>
              )}
              
              {uploadedImageInfo && (
                <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded text-sm">
                  <div className="text-green-300 font-medium mb-1">
                    ✓ {uploadedImageInfo.fileName}
                  </div>
                  <div className="text-green-400 text-xs">
                    {formatFileSize(uploadedImageInfo.size)}
                  </div>
                </div>
              )}
              
              {/* User's Existing Mockups */}
              {userMockups.length > 0 && (
                <>
                  <h3 className="font-bold text-white mt-6 mb-3">Your Mockups</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {userMockups.map((mockup, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setUploadedImage(mockup.url);
                          setUploadedImageInfo(mockup);
                          setSelectedTemplate(null);
                        }}
                        className={`p-2 rounded border text-left transition-all ${
                          uploadedImageInfo?.fileName === mockup.fileName
                            ? 'border-purple-500 bg-purple-900/20'
                            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-sm font-medium text-white truncate">
                          {mockup.fileName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(mockup.size)}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* QR Placement Presets */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📱</span>
                QR Position
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {QR_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => setQrPlacement(preset.placement)}
                    className={`p-3 rounded-lg border transition-all text-center ${
                      JSON.stringify(qrPlacement) === JSON.stringify(preset.placement)
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual QR Controls */}
            <div className="mb-8">
              <h3 className="font-bold text-white mb-3">Manual Adjustment</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">X Position (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={qrPlacement.x}
                    onChange={(e) => setQrPlacement({...qrPlacement, x: Number(e.target.value)})}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Y Position (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={qrPlacement.y}
                    onChange={(e) => setQrPlacement({...qrPlacement, y: Number(e.target.value)})}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Size (%)</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={qrPlacement.width}
                    onChange={(e) => setQrPlacement({...qrPlacement, width: Number(e.target.value), height: Number(e.target.value)})}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Export Controls */}
            <div>
              <NeonButton
                onClick={exportDesign}
                disabled={!selectedTemplate && !uploadedImage || isGenerating}
                variant="primary"
                size="lg"
                className="w-full"
                glow={!isGenerating}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating...
                  </span>
                ) : (
                  <>📥 Export PNG</>
                )}
              </NeonButton>
            </div>
          </AnimatedCard>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-900/5">
          <AnimatedCard direction="right" delay={200} className="w-full max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
              <span>👁️</span>
              Live Preview
            </h2>
            
            <div className="bg-white rounded-lg p-8 mb-6 flex items-center justify-center min-h-[400px]">
              {selectedTemplate || uploadedImage ? (
                <div className="relative">
                  {/* Background */}
                  {uploadedImage ? (
                    <img 
                      src={uploadedImage} 
                      alt="Custom mockup"
                      className="max-w-full max-h-96 object-contain"
                    />
                  ) : selectedTemplate ? (
                    <div 
                      className="bg-gray-200 border-2 border-gray-300 flex items-center justify-center"
                      style={{
                        width: `${selectedTemplate.canvasWidth}px`,
                        height: `${selectedTemplate.canvasHeight}px`,
                        maxWidth: '100%',
                        maxHeight: '400px'
                      }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">
                          {selectedTemplate.type === 'tshirt' ? '👕' :
                           selectedTemplate.type === 'sticker' ? '🏷️' :
                           selectedTemplate.type === 'helmet' ? '⛑️' :
                           selectedTemplate.type === 'poster' ? '📄' : '🎫'}
                        </div>
                        <div className="text-gray-600 font-medium">{selectedTemplate.name}</div>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* QR Code Overlay */}
                  <div 
                    className="absolute bg-white border-2 border-purple-500 flex items-center justify-center"
                    style={{
                      left: `${qrPlacement.x}%`,
                      top: `${qrPlacement.y}%`,
                      width: `${qrPlacement.width}px`,
                      height: `${qrPlacement.height}px`,
                      transform: `translate(-50%, -50%) rotate(${qrPlacement.rotation}deg)`,
                      minWidth: '40px',
                      minHeight: '40px'
                    }}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📱</div>
                      <div className="text-xs text-gray-600">QR</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-xl mb-2">Select a template or upload an image</h3>
                  <p className="text-sm">Choose from the left panel to start designing</p>
                </div>
              )}
            </div>

            {/* Preview Info */}
            {(selectedTemplate || uploadedImage) && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-bold text-purple-300 mb-2">Design Info</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <div>QR Position: {qrPlacement.x}%, {qrPlacement.y}%</div>
                  <div>QR Size: {qrPlacement.width}x{qrPlacement.height}px</div>
                  <div>QR Data: {userQRCode.substring(0, 50)}...</div>
                </div>
              </div>
            )}
          </AnimatedCard>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}