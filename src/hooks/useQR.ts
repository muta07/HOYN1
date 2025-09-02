// src/hooks/useQR.ts
'use client';

import { useState, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { getUserDisplayName, getUserUsername, generateHOYNQR } from '@/lib/qr-utils';
import { UserProfile, BusinessProfile } from '@/lib/firebase';

export type QRType = 'profile' | 'anonymous' | 'custom';

export interface QRSettings {
  size: number;
  bgColor: string;
  fgColor: string;
  showLogo: boolean;
  customLogo?: string;
}

export interface QRState {
  type: QRType;
  customValue: string;
  settings: QRSettings;
  isGenerating: boolean;
  isDownloading: boolean;
  error: string | null;
}

export interface UseQRReturn {
  // State
  qrState: QRState;
  qrValue: string;
  isReady: boolean;
  
  // Actions
  setQRType: (type: QRType) => void;
  setCustomValue: (value: string) => void;
  updateSettings: (settings: Partial<QRSettings>) => void;
  setCustomLogo: (logo: string) => void;
  generateQR: () => Promise<void>;
  downloadQR: (elementId: string, filename: string) => Promise<void>;
  resetQR: () => void;
  clearError: () => void;
}

const defaultSettings: QRSettings = {
  size: 256,
  bgColor: '#000000',
  fgColor: '#E040FB',
  showLogo: false,
};

const defaultState: QRState = {
  type: 'profile',
  customValue: '',
  settings: defaultSettings,
  isGenerating: false,
  isDownloading: false,
  error: null,
};

export function useQR(
  user: User | null, 
  profile?: UserProfile | BusinessProfile | null
): UseQRReturn {
  const [qrState, setQrState] = useState<QRState>(defaultState);

  // Generate QR value based on current state
  const qrValue = useMemo(() => {
    if (!user) return '';
    
    const username = getUserUsername(user);
    
    try {
      switch (qrState.type) {
        case 'profile':
          return generateHOYNQR(username, 'profile');
        case 'anonymous':
          return generateHOYNQR(username, 'anonymous');
        case 'custom':
          if (qrState.customValue.trim()) {
            const hoynCustomData = {
              hoyn: true,
              type: 'custom',
              url: qrState.customValue.trim(),
              username: username,
              createdAt: new Date().toISOString(),
              version: '1.0'
            };
            return JSON.stringify(hoynCustomData);
          }
          return generateHOYNQR(username, 'profile');
        default:
          return generateHOYNQR(username, 'profile');
      }
    } catch (error) {
      console.error('QR value generation error:', error);
      return '';
    }
  }, [user, qrState.type, qrState.customValue]);

  // Check if QR is ready to be displayed
  const isReady = useMemo(() => {
    return !!(user && qrValue);
  }, [user, qrValue]);

  // Actions
  const setQRType = useCallback((type: QRType) => {
    setQrState(prev => ({ 
      ...prev, 
      type, 
      error: null 
    }));
  }, []);

  const setCustomValue = useCallback((customValue: string) => {
    setQrState(prev => ({ 
      ...prev, 
      customValue, 
      error: null 
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<QRSettings>) => {
    setQrState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
      error: null
    }));
  }, []);

  const setCustomLogo = useCallback((logo: string) => {
    setQrState(prev => ({
      ...prev,
      settings: { ...prev.settings, customLogo: logo },
      error: null
    }));
  }, []);

  const generateQR = useCallback(async () => {
    if (!user) {
      setQrState(prev => ({ ...prev, error: 'Kullanıcı girişi gerekli' }));
      return;
    }

    if (qrState.type === 'custom' && !qrState.customValue.trim()) {
      setQrState(prev => ({ ...prev, error: 'Lütfen özel URL\'nizi girin' }));
      return;
    }

    setQrState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Simulate generation process for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ QR Generated:', {
        type: qrState.type,
        value: qrValue,
        username: getUserUsername(user)
      });

    } catch (error) {
      console.error('QR generation error:', error);
      setQrState(prev => ({ 
        ...prev, 
        error: 'QR oluşturulurken hata oluştu' 
      }));
    } finally {
      setQrState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [user, qrState.type, qrState.customValue, qrValue]);

  const downloadQR = useCallback(async (elementId: string, filename: string) => {
    setQrState(prev => ({ ...prev, isDownloading: true, error: null }));

    try {
      // Dynamic import to avoid SSR issues
      const { downloadQRCode } = await import('@/lib/qr-utils');
      await downloadQRCode(elementId, filename);
      console.log('✅ QR Downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      setQrState(prev => ({ 
        ...prev, 
        error: 'İndirme başarısız oldu' 
      }));
    } finally {
      setQrState(prev => ({ ...prev, isDownloading: false }));
    }
  }, []);

  const resetQR = useCallback(() => {
    setQrState(defaultState);
  }, []);

  const clearError = useCallback(() => {
    setQrState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    qrState,
    qrValue,
    isReady,
    setQRType,
    setCustomValue,
    updateSettings,
    setCustomLogo,
    generateQR,
    downloadQR,
    resetQR,
    clearError
  };
}