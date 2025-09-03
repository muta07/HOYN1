// src/lib/stats.ts
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserStats {
  scans: number;
  views: number;
  clicks: number;
  lastUpdated: any;
  userId: string;
}

const STATS_COLLECTION = 'stats';

/**
 * Get user statistics from Firestore
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const statsRef = doc(db, STATS_COLLECTION, userId);
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      return statsSnap.data() as UserStats;
    } else {
      // Initialize stats if they don't exist
      const initialStats: UserStats = {
        scans: 0,
        views: 0,
        clicks: 0,
        lastUpdated: serverTimestamp(),
        userId
      };
      
      await setDoc(statsRef, initialStats);
      return initialStats;
    }
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

/**
 * Increment profile views
 */
export async function incrementProfileViews(userId: string): Promise<boolean> {
  try {
    const statsRef = doc(db, STATS_COLLECTION, userId);
    
    await updateDoc(statsRef, {
      views: increment(1),
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Profile view incremented for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error incrementing profile views:', error);
    
    // If document doesn't exist, create it
    try {
      const statsRef = doc(db, STATS_COLLECTION, userId);
      const initialStats: UserStats = {
        scans: 0,
        views: 1,
        clicks: 0,
        lastUpdated: serverTimestamp(),
        userId
      };
      
      await setDoc(statsRef, initialStats);
      console.log('✅ Stats document created with initial view for user:', userId);
      return true;
    } catch (createError) {
      console.error('❌ Error creating stats document:', createError);
      return false;
    }
  }
}

/**
 * Increment QR scans
 */
export async function incrementQRScans(userId: string): Promise<boolean> {
  try {
    const statsRef = doc(db, STATS_COLLECTION, userId);
    
    await updateDoc(statsRef, {
      scans: increment(1),
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ QR scan incremented for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error incrementing QR scans:', error);
    
    // If document doesn't exist, create it
    try {
      const statsRef = doc(db, STATS_COLLECTION, userId);
      const initialStats: UserStats = {
        scans: 1,
        views: 0,
        clicks: 0,
        lastUpdated: serverTimestamp(),
        userId
      };
      
      await setDoc(statsRef, initialStats);
      console.log('✅ Stats document created with initial scan for user:', userId);
      return true;
    } catch (createError) {
      console.error('❌ Error creating stats document:', createError);
      return false;
    }
  }
}

/**
 * Increment link clicks
 */
export async function incrementLinkClicks(userId: string): Promise<boolean> {
  try {
    const statsRef = doc(db, STATS_COLLECTION, userId);
    
    await updateDoc(statsRef, {
      clicks: increment(1),
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Link click incremented for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error incrementing link clicks:', error);
    
    // If document doesn't exist, create it
    try {
      const statsRef = doc(db, STATS_COLLECTION, userId);
      const initialStats: UserStats = {
        scans: 0,
        views: 0,
        clicks: 1,
        lastUpdated: serverTimestamp(),
        userId
      };
      
      await setDoc(statsRef, initialStats);
      console.log('✅ Stats document created with initial click for user:', userId);
      return true;
    } catch (createError) {
      console.error('❌ Error creating stats document:', createError);
      return false;
    }
  }
}

/**
 * Format number with K, M suffix
 */
export function formatStatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}