'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Profile } from '@/lib/firebase';

interface ProfileAnalyticsProps {
  profileId: string;
  initialViews?: number;
  initialScans?: number;
  initialClicks?: number;
  followersCount?: number;
}

export default function ProfileAnalytics({
  profileId,
  initialViews = 0,
  initialScans = 0,
  initialClicks = 0,
  followersCount = 0
}: ProfileAnalyticsProps) {
  const [views, setViews] = useState(initialViews);
  const [scans, setScans] = useState(initialScans);
  const [clicks, setClicks] = useState(initialClicks);
  const [followers, setFollowers] = useState(followersCount);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;

    // Set up real-time listener for profile stats
    const profileRef = doc(db, 'profiles', profileId);
    const unsubscribe = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Profile;
        setViews(data.stats.views || 0);
        setScans(data.stats.scans || 0);
        setClicks(data.stats.clicks || 0);
        setFollowers(data.stats.followers || 0);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [profileId]);

  // Format large numbers with K or M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="glass-effect p-3 rounded-lg text-center border border-purple-500/30 cyber-border-neon">
        <div className="text-xl font-bold text-white glow-text-stat">
          {loading ? '...' : formatNumber(views)}
        </div>
        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <span>👁</span>
          <span>Views</span>
        </div>
      </div>
      
      <div className="glass-effect p-3 rounded-lg text-center border border-purple-500/30 cyber-border-neon">
        <div className="text-xl font-bold text-white glow-text-stat">
          {loading ? '...' : formatNumber(scans)}
        </div>
        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <span>📱</span>
          <span>Scans</span>
        </div>
      </div>
      
      <div className="glass-effect p-3 rounded-lg text-center border border-purple-500/30 cyber-border-neon">
        <div className="text-xl font-bold text-white glow-text-stat">
          {loading ? '...' : formatNumber(clicks)}
        </div>
        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <span>🔗</span>
          <span>Clicks</span>
        </div>
      </div>
      
      <div className="glass-effect p-3 rounded-lg text-center border border-purple-500/30 cyber-border-neon">
        <div className="text-xl font-bold text-white glow-text-stat">
          {loading ? '...' : formatNumber(followers)}
        </div>
        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <span>👥</span>
          <span>Followers</span>
        </div>
      </div>
    </div>
  );
}