// src/components/BottomNavigation.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  activeIcon?: string;
  submenu?: NavItem[];
}

export default function BottomNavigation() {
  const { user } = useAuth();
  const { hasPremiumAccess } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Don't show navigation if user is not authenticated
  if (!user) return null;

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openSubmenu) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openSubmenu]);

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Ana Sayfa',
      icon: '🏠',
      activeIcon: '🏠',
      path: '/dashboard'
    },
    {
      id: 'feed',
      label: 'Akış',
      icon: '📁',
      activeIcon: '📰',
      path: '/feed'
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
    // Add Premium link for users with premium access
    ...(hasPremiumAccess ? [{
      id: 'premium',
      label: 'Premium',
      icon: '💎',
      activeIcon: '🌟',
      path: '/premium'
    }] : []),
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

  // Toggle submenu for profile button
  const toggleSubmenu = (itemId: string) => {
    setOpenSubmenu(openSubmenu === itemId ? null : itemId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-purple-900/50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2 relative">
          {navItems.map((item) => {
            const active = isActive(item.path || '');
            const displayIcon = active ? (item.activeIcon || item.icon) : item.icon;
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => {
                    if (item.submenu) {
                      toggleSubmenu(item.id);
                    } else if (item.path) {
                      handleNavigation(item.path);
                    }
                  }}
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
                
                {/* Submenu */}
                {item.submenu && openSubmenu === item.id && (
                  <div className="absolute bottom-16 flex flex-col space-y-2 bg-black/90 backdrop-blur-lg border border-purple-900/50 rounded-xl p-2 min-w-[140px]">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (subItem.path) {
                            handleNavigation(subItem.path);
                            setOpenSubmenu(null);
                          }
                        }}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-900/50 transition-colors duration-200"
                      >
                        <span>{subItem.icon}</span>
                        <span className="text-xs whitespace-nowrap">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}