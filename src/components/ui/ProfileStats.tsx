// src/components/ui/ProfileStats.tsx
'use client';

import { useState, useEffect } from 'react';
import { getProfileById, incrementProfileStats } from '@/lib/firebase';
import { formatStatNumber } from '@/lib/stats';
import { Profile } from '@/lib/firebase';
import Loading from './Loading';
import AnimatedCard from './AnimatedCard';
import NeonButton from './NeonButton';

interface ProfileStatsProps {
  profileId: string;
  isOwnProfile?: boolean;
  className?: string;
}

export default function ProfileStats({ 
  profileId, 
  isOwnProfile = false, 
  className = '' 
}: ProfileStatsProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile and stats, increment view if not own profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current profile with stats
        const loadedProfile = await getProfileById(profileId);
        
        if (loadedProfile && loadedProfile.stats) {
          setProfile(loadedProfile);
          
          // Increment profile view if it's not the owner viewing their own profile
          if (!isOwnProfile) {
            await incrementProfileStats(profileId, 'views', 1);
            // Update local state to reflect the increment
            setProfile(prev => prev ? { ...prev, stats: { ...prev.stats, views: prev.stats.views + 1 } } : null);
          }
        } else {
          setError('İstatistikler yüklenemedi');
        }
      } catch (err) {
        console.error('Stats loading error:', err);
        setError('İstatistikler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      loadProfile();
    }
  }, [profileId, isOwnProfile]);

  if (loading) {
    return (
      <div className={`glass-effect p-6 rounded-xl cyber-border ${className}`}>
        <div className="flex items-center justify-center">
          <Loading size="sm" text="İstatistikler yükleniyor..." />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`glass-effect p-6 rounded-xl cyber-border bg-red-900/20 border-red-500/30 ${className}`}>
        <div className="text-center">
          <span className="text-red-400 text-sm">
            {error || 'İstatistikler bulunamadı'}
          </span>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: '👁️ Görünümler',
      value: profile.stats.views,
      icon: '👁️',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      description: 'Profilin kaç kez görüntülendi'
    },
    {
      label: '🔗 QR Taramaları',
      value: profile.stats.scans,
      icon: '🔗',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      description: 'QR kodun kaç kez tarandı'
    },
    {
      label: '💌 Mesajlar',
      value: profile.stats.messages,
      icon: '💌',
      color: 'text-pink-400',
      bgColor: 'bg-pink-900/20',
      description: 'Alınan mesaj sayısı (normal + anonim)'
    },
    {
      label: '⭐ Takipçiler',
      value: profile.stats.followers,
      icon: '⭐',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      description: 'Profilini takip eden kişi sayısı'
    }
  ];

  return (
    <AnimatedCard className={`glass-effect p-6 rounded-xl cyber-border ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 glow-text flex items-center gap-2">
          <span>📊</span>
          İstatistikler
        </h3>
        {isOwnProfile && (
          <p className="text-sm text-gray-400">
            Profil performansını takip et
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div
            key={item.label}
            className={`neon-card ${item.bgColor} border border-gray-600 rounded-lg p-4 text-center transition-all duration-300 hover:scale-105 hover:border-purple-500/50 hover:shadow-purple-500/25`}
          >
            <div className={`text-3xl mb-2 ${item.color}`}>{item.icon}</div>
            <div className={`text-2xl font-bold ${item.color} mb-1`}>
              {formatStatNumber(item.value)}
            </div>
            <div className="text-xs font-medium text-gray-300 mb-1">
              {item.label}
            </div>
            {isOwnProfile && (
              <div className="text-xs text-gray-500">
                {item.description}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Last Updated */}
      {isOwnProfile && profile.updatedAt && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Son güncelleme: {new Date(profile.updatedAt).toLocaleDateString('tr-TR')}
          </p>
        </div>
      )}

      {/* Growth Tip for Own Profile */}
      {isOwnProfile && (
        <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
          <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-1">
            <span>💡</span>
            İpucu
          </h4>
          <p className="text-xs text-gray-300">
            QR kodunu sosyal medyada paylaş, profil görüntülenmelerini ve takipçilerini artır!
          </p>
        </div>
      )}
    </AnimatedCard>
  );
}
