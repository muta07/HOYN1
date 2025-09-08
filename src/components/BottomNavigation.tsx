'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/components/providers';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
  path: string;
}

export default function BottomNavigation() {
  const { user } = useAuth();
  const { hasPremiumAccess } = useSubscription();
  const { totalUnread, hasUnreadMessages } = useMessages();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navigation if user is not authenticated
  if (!user) return null;

  const navItems: NavItem[] = [
    {
      id: 'scanner',
      label: 'QR Tarayıcı',
      icon: '📱',
      activeIcon: '📱',
      path: '/scan'
    },
    {
      id: 'add',
      label: '+',
      icon: '➕',
      activeIcon: '➕',
      path: '/dashboard/profile/create'
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
        <div className="flex items-center justify-between py-2 px-4">
          {/* Left: QR Scanner */}
          <button
            onClick={() => handleNavigation(navItems[0].path)}
            className={`flex flex-col items-center justify-center p-3 transition-all duration-200 ${
              isActive(navItems[0].path)
                ? 'text-purple-400 scale-110' 
                : 'text-gray-400 hover:text-gray-200 hover:scale-105'
            }`}
            aria-label={navItems[0].label}
          >
            <span className={`text-2xl transition-all duration-200 ${
              isActive(navItems[0].path) ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''
            }`}>
              {navItems[0].icon}
            </span>
            <span className={`text-xs font-medium transition-all duration-200 ${
              isActive(navItems[0].path) ? 'text-purple-300' : 'text-gray-500'
            }`}>
              {navItems[0].label}
            </span>
          </button>

          {/* Center: + Add Profile (larger, centered) */}
          <button
            onClick={() => handleNavigation(navItems[1].path)}
            className={`relative p-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 glow-subtle transition-all duration-200 ${
              isActive(navItems[1].path) ? 'scale-110 shadow-lg' : 'hover:scale-110'
            }`}
            aria-label={navItems[1].label}
          >
            <span className={`text-3xl transition-all duration-200 ${
              isActive(navItems[1].path) ? 'drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]' : ''
            }`}>
              {navItems[1].icon}
            </span>
            {/* Active indicator for center button */}
            {isActive(navItems[1].path) && (
              <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-pulse"></div>
            )}
          </button>

          {/* Right: Messages with badge */}
          <button
            onClick={() => handleNavigation(navItems[2].path)}
            className={`relative flex flex-col items-center justify-center p-3 transition-all duration-200 ${
              isActive(navItems[2].path)
                ? 'text-purple-400 scale-110' 
                : 'text-gray-400 hover:text-gray-200 hover:scale-105'
            }`}
            aria-label={`${navItems[2].label} ${hasUnreadMessages ? '(Yeni mesajlar var)' : ''}`}
          >
            <span className={`relative text-2xl transition-all duration-200 ${
              isActive(navItems[2].path) ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''
            }`}>
              {navItems[2].icon}
              {hasUnreadMessages && !isActive(navItems[2].path) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-[1.25rem] flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </span>
            <span className={`text-xs font-medium transition-all duration-200 ${
              isActive(navItems[2].path) ? 'text-purple-300' : 'text-gray-500'
            }`}>
              {navItems[2].label}
            </span>
          </button>

          {/* Far Right: Profile */}
          <button
            onClick={() => handleNavigation(navItems[3].path)}
            className={`flex flex-col items-center justify-center p-3 transition-all duration-200 ${
              isActive(navItems[3].path)
                ? 'text-purple-400 scale-110' 
                : 'text-gray-400 hover:text-gray-200 hover:scale-105'
            }`}
            aria-label={navItems[3].label}
          >
            <span className={`text-2xl transition-all duration-200 ${
              isActive(navItems[3].path) ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''
            }`}>
              {navItems[3].icon}
            </span>
            <span className={`text-xs font-medium transition-all duration-200 ${
              isActive(navItems[3].path) ? 'text-purple-300' : 'text-gray-500'
            }`}>
              {navItems[3].label}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
