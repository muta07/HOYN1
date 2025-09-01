// src/components/designer/DesignCanvas.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Product } from './ProductGrid';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import AIQRGenerator from './AIQRGenerator';
import dynamic from 'next/dynamic';

// Dynamic import for QR Code
const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => ({ default: mod.QRCodeSVG })), {
  ssr: false
});

// Professional Resize Handles Component
interface ResizeHandlesProps {
  onMouseDown: (handle: string, e: React.MouseEvent) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ onMouseDown }) => {
  const handles = [
    { position: 'nw', cursor: 'nw-resize', className: '-top-1 -left-1' },
    { position: 'n', cursor: 'n-resize', className: '-top-1 left-1/2 transform -translate-x-1/2' },
    { position: 'ne', cursor: 'ne-resize', className: '-top-1 -right-1' },
    { position: 'e', cursor: 'e-resize', className: 'top-1/2 -right-1 transform -translate-y-1/2' },
    { position: 'se', cursor: 'se-resize', className: '-bottom-1 -right-1' },
    { position: 's', cursor: 's-resize', className: '-bottom-1 left-1/2 transform -translate-x-1/2' },
    { position: 'sw', cursor: 'sw-resize', className: '-bottom-1 -left-1' },
    { position: 'w', cursor: 'w-resize', className: 'top-1/2 -left-1 transform -translate-y-1/2' }
  ];

  return (
    <>
      {handles.map(({ position, cursor, className }) => (
        <div
          key={position}
          className={`absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-sm z-20 hover:bg-purple-600 transition-colors ${className}`}
          style={{ cursor }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMouseDown(position, e);
          }}
        />
      ))}
    </>
  );
};

interface DesignElement {
  id: string;
  type: 'qr' | 'text' | 'image' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  shadow?: boolean;
  layer?: number;
  locked?: boolean;
  visible?: boolean;
}

interface DesignCanvasProps {
  product: Product;
  onBack: () => void;
  userQRCode?: string;
}

export default function DesignCanvas({ product, onBack, userQRCode }: DesignCanvasProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialElementState, setInitialElementState] = useState<any>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [history, setHistory] = useState<DesignElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [newText, setNewText] = useState('');
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showAIQRGenerator, setShowAIQRGenerator] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Professional fonts
  const fonts = [
    'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Playfair Display',
    'Orbitron', 'Space Mono', 'Fira Code', 'Dancing Script', 'Pacifico'
  ];
  
  // Design templates
  const templates = [
    { id: 'minimal', name: 'Minimal QR', preview: '🔲', desc: 'Clean and simple' },
    { id: 'cyberpunk', name: 'Cyberpunk', preview: '⚡', desc: 'Futuristic neon' },
    { id: 'elegant', name: 'Elegant', preview: '✨', desc: 'Luxury style' },
    { id: 'retro', name: 'Retro Wave', preview: '🌊', desc: '80s aesthetic' },
    { id: 'neon', name: 'Neon Glow', preview: '💫', desc: 'Glowing effects' }
  ];
  
  // Print area boundaries
  const printArea = { x: 50, y: 60, width: 300, height: 380 };
  const gridSize = 20; // Grid snap size
  
  // Helper function to snap to grid
  const snapToGridValue = (value: number, snapEnabled = snapToGrid) => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  };
  
  // Helper function to constrain element to print area
  const constrainToPrintArea = (element: Partial<DesignElement>, printArea: any) => {
    const minSize = 20;
    const maxX = printArea.x + printArea.width;
    const maxY = printArea.y + printArea.height;
    
    return {
      ...element,
      x: Math.max(printArea.x, Math.min(maxX - (element.width || 100), element.x || 0)),
      y: Math.max(printArea.y, Math.min(maxY - (element.height || 100), element.y || 0)),
      width: Math.max(minSize, Math.min(printArea.width, element.width || 100)),
      height: Math.max(minSize, Math.min(printArea.height, element.height || 100))
    };
  };
  
  // Add to history for undo/redo
  const addToHistory = (newElements: DesignElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    if (newHistory.length > 50) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Add QR Code
  const addQRCode = () => {
    if (!userQRCode) return;
    
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'qr',
      content: userQRCode,
      x: 150,
      y: 100,
      width: 120,
      height: 120,
      rotation: 0
    };
    
    setElements([...elements, newElement]);
  };

  // Add Text
  const addText = () => {
    if (!newText.trim()) return;
    
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'text',
      content: newText,
      x: 100,
      y: 200,
      width: 200,
      height: 40,
      rotation: 0,
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'Arial'
    };
    
    setElements([...elements, newElement]);
    setNewText('');
  };

  // Generate AI Design with Professional Features
  const generateAIDesign = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingAI(true);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const promptLower = aiPrompt.toLowerCase();
    let newElements: DesignElement[] = [];
    
    // Advanced AI Style Detection
    if (promptLower.includes('cyber') || promptLower.includes('futur')) {
      // Cyberpunk Style
      newElements = [
        {
          id: Date.now().toString(),
          type: 'text',
          content: 'CYBER HOYN!',
          x: 80, y: 100, width: 240, height: 50,
          rotation: 0, fontSize: 28, color: '#00FFFF',
          fontFamily: 'Orbitron', fontWeight: 'bold',
          textAlign: 'center', shadow: true, layer: 2,
          locked: false, visible: true
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'shape',
          content: 'neon-line',
          x: 100, y: 160, width: 200, height: 4,
          rotation: 0, backgroundColor: '#E040FB',
          layer: 1, locked: false, visible: true
        }
      ];
    } else if (promptLower.includes('neon') || promptLower.includes('glow')) {
      // Neon Style
      newElements = [
        {
          id: Date.now().toString(),
          type: 'text',
          content: '✨ NEON VIBES ✨',
          x: 60, y: 180, width: 280, height: 40,
          rotation: 0, fontSize: 22, color: '#FF006E',
          fontFamily: 'Space Mono', fontWeight: 'bold',
          textAlign: 'center', shadow: true, layer: 1,
          locked: false, visible: true
        }
      ];
    } else if (promptLower.includes('elegant') || promptLower.includes('luxury')) {
      // Elegant Style
      newElements = [
        {
          id: Date.now().toString(),
          type: 'text',
          content: 'Elegant Design',
          x: 100, y: 190, width: 200, height: 35,
          rotation: 0, fontSize: 22, color: '#D4AF37',
          fontFamily: 'Playfair Display', fontWeight: 'normal',
          textAlign: 'center', layer: 1,
          locked: false, visible: true
        }
      ];
    } else {
      // Custom/Default Style
      newElements = [
        {
          id: Date.now().toString(),
          type: 'text',
          content: aiPrompt.substring(0, 30) || 'AI Design',
          x: 100, y: 200, width: 200, height: 30,
          rotation: 0, fontSize: 18, color: '#FFFFFF',
          fontFamily: 'Inter', fontWeight: 'normal',
          textAlign: 'center', layer: 1,
          locked: false, visible: true
        }
      ];
    }
    
    setElements([...elements, ...newElements]);
    setAiPrompt('');
    setShowAIPrompt(false);
    setIsGeneratingAI(false);
  };

  // Handle mouse down for dragging and resizing
  const handleMouseDown = (e: React.MouseEvent, elementId: string, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedElement(elementId);
    setSelectedElements([elementId]);
    
    const element = elements.find(el => el.id === elementId);
    if (!element || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    
    setInitialMousePos({ x: mouseX, y: mouseY });
    setInitialElementState({ ...element });
    
    if (handle) {
      // Resizing
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      // Dragging
      setIsDragging(true);
      const offsetX = mouseX - element.x;
      const offsetY = mouseY - element.y;
      setDragOffset({ x: offsetX, y: offsetY });
    }
  };

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selectedElement || !canvasRef.current || (!isDragging && !isResizing)) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    
    if (isDragging) {
      // Dragging logic
      const newX = snapToGridValue(mouseX - dragOffset.x);
      const newY = snapToGridValue(mouseY - dragOffset.y);
      
      setElements(prev => prev.map(el => {
        if (el.id === selectedElement) {
          const updated = constrainToPrintArea({ ...el, x: newX, y: newY }, printArea);
          return updated as DesignElement;
        }
        return el;
      }));
    } else if (isResizing && resizeHandle && initialElementState) {
      // Resizing logic
      const deltaX = mouseX - initialMousePos.x;
      const deltaY = mouseY - initialMousePos.y;
      
      let newWidth = initialElementState.width;
      let newHeight = initialElementState.height;
      let newX = initialElementState.x;
      let newY = initialElementState.y;
      
      // Handle different resize directions
      switch (resizeHandle) {
        case 'nw': // Top-left
          newWidth = Math.max(20, initialElementState.width - deltaX);
          newHeight = Math.max(20, initialElementState.height - deltaY);
          newX = initialElementState.x + (initialElementState.width - newWidth);
          newY = initialElementState.y + (initialElementState.height - newHeight);
          break;
        case 'n': // Top
          newHeight = Math.max(20, initialElementState.height - deltaY);
          newY = initialElementState.y + (initialElementState.height - newHeight);
          break;
        case 'ne': // Top-right
          newWidth = Math.max(20, initialElementState.width + deltaX);
          newHeight = Math.max(20, initialElementState.height - deltaY);
          newY = initialElementState.y + (initialElementState.height - newHeight);
          break;
        case 'e': // Right
          newWidth = Math.max(20, initialElementState.width + deltaX);
          break;
        case 'se': // Bottom-right
          newWidth = Math.max(20, initialElementState.width + deltaX);
          newHeight = Math.max(20, initialElementState.height + deltaY);
          break;
        case 's': // Bottom
          newHeight = Math.max(20, initialElementState.height + deltaY);
          break;
        case 'sw': // Bottom-left
          newWidth = Math.max(20, initialElementState.width - deltaX);
          newHeight = Math.max(20, initialElementState.height + deltaY);
          newX = initialElementState.x + (initialElementState.width - newWidth);
          break;
        case 'w': // Left
          newWidth = Math.max(20, initialElementState.width - deltaX);
          newX = initialElementState.x + (initialElementState.width - newWidth);
          break;
      }
      
      // Apply snap to grid for size
      if (snapToGrid) {
        newWidth = snapToGridValue(newWidth);
        newHeight = snapToGridValue(newHeight);
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
      }
      
      setElements(prev => prev.map(el => {
        if (el.id === selectedElement) {
          const updated = constrainToPrintArea({
            ...el, x: newX, y: newY, width: newWidth, height: newHeight
          }, printArea);
          return updated as DesignElement;
        }
        return el;
      }));
    }
  }, [isDragging, isResizing, selectedElement, dragOffset, resizeHandle, initialMousePos, initialElementState, snapToGrid, zoom]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      // Add current state to history when operation completes
      addToHistory(elements);
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragOffset({ x: 0, y: 0 });
    setInitialMousePos({ x: 0, y: 0 });
    setInitialElementState(null);
  }, [isDragging, isResizing, elements]);

  // Add event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing ? 'nwse-resize' : 'move';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  // Initialize history
  useEffect(() => {
    if (elements.length === 0 && history.length === 0) {
      setHistory([[]]);
      setHistoryIndex(0);
    }
  }, [elements.length, history.length]);
  
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          // Undo
          if (historyIndex > 0) {
            const previousState = history[historyIndex - 1];
            setElements([...previousState]);
            setHistoryIndex(historyIndex - 1);
          }
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          // Redo
          if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setElements([...nextState]);
            setHistoryIndex(historyIndex + 1);
          }
        }
      }
      
      // Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          e.preventDefault();
          deleteElement(selectedElement);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedElement]);

  // Delete element
  const deleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  // Handle AI QR Art Generation
  const handleAIQRGenerated = (imageUrl: string) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'image',
      content: imageUrl,
      x: printArea.x + 50,
      y: printArea.y + 50,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      borderRadius: 8,
      layer: elements.length + 1,
      locked: false,
      visible: true
    };
    
    setElements([...elements, newElement]);
    setShowAIQRGenerator(false);
  };

  // Download design
  const downloadDesign = async () => {
    if (!canvasRef.current) return;
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: selectedColor.hex,
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `hoyn-${product.name.toLowerCase().replace(/\\s+/g, '-')}-design.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <AnimatedCard direction="up" delay={0}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black glow-text font-orbitron mb-2">
                🎨 Pro Tasarım Stüdyosu
              </h1>
              <p className="text-gray-400 mb-2">
                {product.name} - Printify Seviyesi Tasarım Araçları
              </p>
              <div className="flex items-center gap-4 text-sm text-purple-300">
                <span>Zoom: {Math.round(zoom * 100)}%</span>
                <span>Grid: {showGrid ? '✓ Açık' : '✗ Kapalı'}</span>
                <span>Snap: {snapToGrid ? '📌 Aktif' : '📌 Pasif'}</span>
                <span>Elementler: {elements.length}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <NeonButton onClick={() => setShowTemplates(true)} variant="secondary" size="sm">
                📋 Şablonlar
              </NeonButton>
              <NeonButton onClick={onBack} variant="outline" size="md">
                ← Ürünlere Dön
              </NeonButton>
            </div>
          </div>
        </AnimatedCard>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Design Canvas */}
          <div className="lg:col-span-2">
            <AnimatedCard direction="left" delay={100}>
              <div className="glass-effect p-6 rounded-xl cyber-border">
                {/* Enhanced Product Options */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-4 items-center">
                    {/* Side Toggle */}
                    {product.mockupBack && (
                      <div className="flex bg-gray-800 rounded-lg p-1">
                        <button
                          onClick={() => setSide('front')}
                          className={`px-4 py-2 rounded-md transition-all ${
                            side === 'front' ? 'bg-purple-600 text-white' : 'text-gray-400'
                          }`}
                        >
                          Ön
                        </button>
                        <button
                          onClick={() => setSide('back')}
                          className={`px-4 py-2 rounded-md transition-all ${
                            side === 'back' ? 'bg-purple-600 text-white' : 'text-gray-400'
                          }`}
                        >
                          Arka
                        </button>
                      </div>
                    )}
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                        className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                        className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Grid Toggle */}
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={`px-3 py-1 rounded text-xs transition-all ${
                        showGrid ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      Grid
                    </button>
                    
                    {/* Snap to Grid Toggle */}
                    <button
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      className={`px-3 py-1 rounded text-xs transition-all ${
                        snapToGrid ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                      title="Snap to Grid"
                    >
                      📌
                    </button>
                    
                    {/* Undo/Redo Buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          if (historyIndex > 0) {
                            const previousState = history[historyIndex - 1];
                            setElements([...previousState]);
                            setHistoryIndex(historyIndex - 1);
                          }
                        }}
                        disabled={historyIndex <= 0}
                        className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Undo (Ctrl+Z)"
                      >
                        ↺
                      </button>
                      <button
                        onClick={() => {
                          if (historyIndex < history.length - 1) {
                            const nextState = history[historyIndex + 1];
                            setElements([...nextState]);
                            setHistoryIndex(historyIndex + 1);
                          }
                        }}
                        disabled={historyIndex >= history.length - 1}
                        className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Redo (Ctrl+Y)"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                  
                  <NeonButton onClick={downloadDesign} variant="primary" size="sm" glow>
                    📱 HQ İndir
                  </NeonButton>
                </div>

                {/* Enhanced Color Selector */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm text-gray-400">Ürün Rengi:</span>
                  <div className="flex gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor.name === color.name 
                            ? 'border-purple-400 scale-110 shadow-lg' 
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                        style={{ 
                          backgroundColor: color.hex === 'transparent' ? '#f0f0f0' : color.hex,
                          backgroundImage: color.hex === 'transparent' ? 'repeating-conic-gradient(#fff 0deg 90deg, #ddd 90deg 180deg)' : 'none'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-white ml-2">{selectedColor.name}</span>
                </div>

                {/* Enhanced Canvas Area */}
                <div className="relative mx-auto">
                  <div 
                    ref={canvasRef}
                    className="relative border-2 border-gray-600 rounded-lg overflow-hidden shadow-xl"
                    style={{ 
                      width: '400px', 
                      height: '500px',
                      backgroundColor: selectedColor.hex === 'transparent' ? '#f0f0f0' : selectedColor.hex,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left'
                    }}
                  >
                    {/* Grid Pattern */}
                    {showGrid && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                          backgroundSize: `${gridSize}px ${gridSize}px`
                        }}
                      />
                    )}
                    
                    {/* Print Area Guide */}
                    <div 
                      className="absolute border-2 border-dashed border-purple-400 opacity-40 rounded"
                      style={{
                        left: printArea.x,
                        top: printArea.y,
                        width: printArea.width,
                        height: printArea.height
                      }}
                    />
                    
                    <div className="absolute top-2 left-2 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
                      Yazdırılabilir Alan
                    </div>
                  {/* Enhanced Design Elements */}
                  {elements.sort((a, b) => (a.layer || 0) - (b.layer || 0)).map((element) => (
                    <div
                      key={element.id}
                      className={`absolute cursor-move transition-all duration-200 ${
                        selectedElement === element.id ? 'ring-2 ring-purple-400 shadow-lg' : ''
                      } ${element.visible === false ? 'opacity-50' : ''}`}
                      style={{
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        transform: `rotate(${element.rotation}deg)`,
                        opacity: element.opacity || 1,
                        zIndex: element.layer || 0,
                        pointerEvents: element.locked ? 'none' : 'auto'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, element.id)}
                    >
                      {element.type === 'qr' && userQRCode && (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            backgroundColor: element.backgroundColor || '#FFFFFF',
                            borderRadius: element.borderRadius || 0,
                            boxShadow: element.shadow ? '0 4px 8px rgba(0,0,0,0.3)' : 'none'
                          }}
                        >
                          <QRCodeSVG 
                            value={userQRCode}
                            size={Math.min(element.width - 8, element.height - 8)}
                            bgColor="transparent"
                            fgColor="#000000"
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      )}
                      
                      {element.type === 'text' && (
                        <div 
                          className="w-full h-full flex items-center justify-center text-center break-words px-2"
                          style={{
                            fontSize: element.fontSize,
                            color: element.color,
                            fontFamily: element.fontFamily,
                            fontWeight: element.fontWeight,
                            textAlign: element.textAlign,
                            backgroundColor: element.backgroundColor,
                            borderRadius: element.borderRadius || 0,
                            textShadow: element.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
                          }}
                        >
                          {element.content}
                        </div>
                      )}
                      
                      {element.type === 'image' && (
                        <img 
                          src={element.content} 
                          alt="Design element"
                          className="w-full h-full object-cover rounded"
                          style={{
                            borderRadius: element.borderRadius || 0,
                            opacity: element.opacity || 1
                          }}
                        />
                      )}
                      
                      {element.type === 'shape' && (
                        <div 
                          className="w-full h-full"
                          style={{
                            backgroundColor: element.backgroundColor || '#E040FB',
                            borderRadius: element.borderRadius || 0,
                            opacity: element.opacity || 1
                          }}
                        />
                      )}
                      
                      {selectedElement === element.id && (
                        <>
                          <button
                            onClick={() => deleteElement(element.id)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10 hover:bg-red-700 transition-colors"
                          >
                            ×
                          </button>
                          
                          {/* Professional Resize Handles */}
                          <ResizeHandles 
                            onMouseDown={(handle, e) => handleMouseDown(e, element.id, handle)}
                          />
                          
                          {/* Rotation Handle */}
                          <div
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
                            title="Rotate"
                          >
                            <div className="w-full h-full flex items-center justify-center text-white text-xs">↻</div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}                
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* Enhanced Design Tools */}
          <div className="space-y-6">
            {/* Professional Tools Panel */}
            <AnimatedCard direction="right" delay={200}>
              <div className="glass-effect p-6 rounded-xl cyber-border">
                <h3 className="text-xl font-bold text-white mb-4">🛠️ Profesyonel Araçlar</h3>
                
                <div className="space-y-4">
                  {/* Add QR Code */}
                  <NeonButton
                    onClick={() => {
                      if (!userQRCode) return;
                      const newElement: DesignElement = {
                        id: Date.now().toString(), type: 'qr', content: userQRCode,
                        x: printArea.x + 100, y: printArea.y + 100,
                        width: 120, height: 120, rotation: 0,
                        backgroundColor: '#FFFFFF', borderRadius: 8,
                        shadow: true, layer: elements.length + 1,
                        locked: false, visible: true
                      };
                      setElements([...elements, newElement]);
                    }}
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={!userQRCode}
                  >
                    ✨ QR Kodu Ekle
                  </NeonButton>
                  
                  {/* Add Text */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Metin ekle..."
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    />
                    <NeonButton
                      onClick={() => {
                        if (!newText.trim()) return;
                        const newElement: DesignElement = {
                          id: Date.now().toString(), type: 'text', content: newText,
                          x: printArea.x + 50, y: printArea.y + 200,
                          width: 200, height: 40, rotation: 0,
                          fontSize: 24, color: '#FFFFFF', fontFamily: 'Inter',
                          fontWeight: 'normal', textAlign: 'center',
                          layer: elements.length + 1, locked: false, visible: true
                        };
                        setElements([...elements, newElement]);
                        setNewText('');
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!newText.trim()}
                    >
                      📝 Metin Ekle
                    </NeonButton>
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const imageUrl = e.target?.result as string;
                          const newElement: DesignElement = {
                            id: Date.now().toString(), type: 'image', content: imageUrl,
                            x: printArea.x + 50, y: printArea.y + 50,
                            width: 150, height: 150, rotation: 0, opacity: 1,
                            layer: elements.length + 1, locked: false, visible: true
                          };
                          setElements([...elements, newElement]);
                        };
                        reader.readAsDataURL(file);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="hidden"
                    />
                    <NeonButton
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      size="md"
                      className="w-full"
                    >
                      🖼️ Resim Yükle
                    </NeonButton>
                  </div>
                  
                  {/* AI Design */}
                  <div className="space-y-2">
                    <NeonButton
                      onClick={() => setShowAIPrompt(!showAIPrompt)}
                      variant="secondary"
                      size="md"
                      className="w-full"
                      glow
                    >
                      🤖 AI ile Tasarla
                    </NeonButton>
                    
                    {showAIPrompt && (
                      <div className="space-y-2">
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="AI'ya ne tasarımı istediğinizi söyleyin:

✨ Örnekler:
• 'cyberpunk neon yazı'
• 'elegant gold text' 
• 'futuristic design'
• 'luxury minimalist'
• 'retro 80s style'"
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 h-24 resize-none text-sm"
                        />
                        <NeonButton
                          onClick={generateAIDesign}
                          variant="primary"
                          size="sm"
                          className="w-full"
                          disabled={!aiPrompt.trim() || isGeneratingAI}
                          glow={!isGeneratingAI}
                        >
                          {isGeneratingAI ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeLinecap="round" />
                              </svg>
                              AI Üretiyor...
                            </span>
                          ) : (
                            '🎨 AI Tasarım Oluştur'
                          )}
                        </NeonButton>
                      </div>
                    )}
                  </div>
                  
                  {/* AI QR Art Generator */}
                  <div className="border-t border-gray-700 pt-4">
                    <NeonButton
                      onClick={() => setShowAIQRGenerator(true)}
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={!userQRCode}
                      glow
                    >
                      🎨 AI QR Sanat Üretici
                    </NeonButton>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      QR kodunuzu sanatsal AI desenlerle birleştirin!
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Templates Panel */}
            {showTemplates && (
              <AnimatedCard direction="right" delay={250}>
                <div className="glass-effect p-6 rounded-xl cyber-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">📋 Profesyonel Şablonlar</h3>
                    <button
                      onClick={() => setShowTemplates(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          // Apply template with professional elements
                          let templateElements: DesignElement[] = [];
                          
                          switch (template.id) {
                            case 'cyberpunk':
                              templateElements = [{
                                id: Date.now().toString(), type: 'text', content: 'HOYN!',
                                x: 120, y: 80, width: 160, height: 50, rotation: 0,
                                fontSize: 32, color: '#00FFFF', fontFamily: 'Orbitron',
                                fontWeight: 'bold', textAlign: 'center', shadow: true,
                                layer: 2, locked: false, visible: true
                              }];
                              break;
                            case 'elegant':
                              templateElements = [{
                                id: Date.now().toString(), type: 'text', content: 'Elegant Style',
                                x: 100, y: 190, width: 200, height: 35, rotation: 0,
                                fontSize: 22, color: '#D4AF37', fontFamily: 'Playfair Display',
                                fontWeight: 'normal', textAlign: 'center',
                                layer: 1, locked: false, visible: true
                              }];
                              break;
                            case 'neon':
                              templateElements = [{
                                id: Date.now().toString(), type: 'text', content: '✨ NEON STYLE ✨',
                                x: 80, y: 160, width: 240, height: 40, rotation: 0,
                                fontSize: 20, color: '#FF006E', fontFamily: 'Space Mono',
                                fontWeight: 'bold', textAlign: 'center', shadow: true,
                                layer: 1, locked: false, visible: true
                              }];
                              break;
                            default:
                              templateElements = [{
                                id: Date.now().toString(), type: 'text', content: 'Clean Design',
                                x: 100, y: 200, width: 200, height: 30, rotation: 0,
                                fontSize: 18, color: '#FFFFFF', fontFamily: 'Inter',
                                fontWeight: 'normal', textAlign: 'center',
                                layer: 1, locked: false, visible: true
                              }];
                          }
                          
                          // Add QR code to template
                          if (userQRCode) {
                            templateElements.push({
                              id: (Date.now() + 10).toString(), type: 'qr', content: userQRCode,
                              x: 180, y: 280, width: 100, height: 100, rotation: 0,
                              backgroundColor: '#FFFFFF', borderRadius: 8, shadow: true,
                              layer: 3, locked: false, visible: true
                            });
                          }
                          
                          setElements(templateElements);
                          setShowTemplates(false);
                        }}
                        className="glass-effect p-4 rounded-lg cyber-border hover:glow-subtle transition-all text-center group"
                      >
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{template.preview}</div>
                        <div className="text-sm font-bold text-white">{template.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{template.desc}</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400">
                      💡 Şablonlar otomatik olarak QR kodunuzu ve tasarım elementlerini ekler
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            )}

            {/* Product Info */}
            <AnimatedCard direction="right" delay={300}>
              <div className="glass-effect p-6 rounded-xl cyber-border">
                <h3 className="text-xl font-bold text-white mb-4">📦 Ürün Bilgisi</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ürün:</span>
                    <span className="text-white font-bold">{product.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fiyat:</span>
                    <span className="text-purple-400 font-bold">{product.price}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Renk:</span>
                    <span className="text-white">{selectedColor.name}</span>
                  </div>
                  
                  {/* Size Selector */}
                  <div>
                    <span className="text-gray-400 block mb-2">Beden:</span>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    >
                      {product.sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Order Button */}
            <AnimatedCard direction="right" delay={400}>
              <NeonButton
                onClick={() => alert('Sipariş özelliği yakında gelecek!')}
                variant="primary"
                size="lg"
                className="w-full"
                glow
              >
                🛒 Sipariş Ver - {product.price}
              </NeonButton>
            </AnimatedCard>
          </div>
        </div>
      </div>
      
      {/* AI QR Art Generator Modal */}
      {showAIQRGenerator && userQRCode && (
        <AIQRGenerator
          userQRCode={userQRCode}
          onGenerated={handleAIQRGenerated}
          onClose={() => setShowAIQRGenerator(false)}
        />
      )}
    </div>
  );
}