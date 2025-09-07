// src/components/ui/FloatingProfileButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FloatingProfileButton() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show if user is not authenticated
  if (!user) return null;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push('/dashboard/linktree');
  };

  const handleQRGeneratorClick = () => {
    setIsOpen(false);
    router.push('/dashboard/qr-generator');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end space-y-3">
          {/* QR Generator Button */}
          <button
            onClick={handleQRGeneratorClick}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <span>📱</span>
            <span className="whitespace-nowrap">QR Oluştur</span>
          </button>
          
          {/* Profile Button */}
          <button
            onClick={handleProfileClick}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <span>👤</span>
            <span className="whitespace-nowrap">Profil</span>
          </button>
        </div>
      )}
      
      {/* Main Floating Button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label={isOpen ? "Menüyü kapat" : "Profil menüsünü aç"}
      >
        <span className="text-2xl">{isOpen ? '✕' : '👤'}</span>
      </button>
    </div>
  );
}