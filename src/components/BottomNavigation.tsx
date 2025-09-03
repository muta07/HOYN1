// src/components/BottomNavigation.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  activeIcon?: string;
}

export default function BottomNavigation() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navigation if user is not authenticated
  if (!user) return null;

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Ana Sayfa',
      icon: '🏠',
      activeIcon: '🏠',
      path: '/dashboard'
    },
    {
      id: 'discover',
      label: 'Keşfet',
      icon: '🔍',
      activeIcon: '🔍',
      path: '/discover'
    },
    {
      id: 'create',
      label: 'Studio',
      icon: '🎨',
      activeIcon: '✨',
      path: '/studio'
    },
    {
      id: 'messages',
      label: 'Mesajlar',
      icon: '💬',
      activeIcon: '💬',
      path: '/dashboard/messages'
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: '👤',
      activeIcon: '👤',
      path: '/dashboard/profile'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-purple-900/50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const displayIcon = active ? (item.activeIcon || item.icon) : item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center p-2 transition-all duration-200 ${
                  active 
                    ? 'text-purple-400 scale-110' 
                    : 'text-gray-400 hover:text-gray-200 hover:scale-105'
                }`}
                aria-label={item.label}
              >
                <span className={`text-xl mb-1 transition-all duration-200 ${
                  active ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''
                }`}>
                  {displayIcon}
                </span>
                <span className={`text-xs font-medium transition-all duration-200 ${
                  active ? 'text-purple-300' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {active && (
                  <div className="absolute -top-0.5 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}