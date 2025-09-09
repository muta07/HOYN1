// src/lib/qr-modes.ts
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type QRMode = 'profile' | 'note' | 'song';

export interface QRModeData {
  mode: QRMode;
  content: string;
  lastUpdated: any;
  userId: string;
}

export interface NoteContent {
  text: string;
  title?: string;
  emoji?: string;
}

export interface SongContent {
  url: string;
  platform: 'spotify' | 'youtube' | 'other';
  title?: string;
  artist?: string;
  albumArt?: string;
}

const QR_MODES_COLLECTION = 'qr_modes';

/**
 * Get user's QR mode configuration
 */
export async function getUserQRMode(userId: string): Promise<QRModeData | null> {
  try {
    // Check if db is initialized
    if (!db) {
      console.error('Firestore is not initialized');
      return null;
    }
    
    const modeRef = doc(db, QR_MODES_COLLECTION, userId);
    const modeSnap = await getDoc(modeRef);
    
    if (modeSnap.exists()) {
      return modeSnap.data() as QRModeData;
    } else {
      // Initialize with default profile mode
      const defaultMode: QRModeData = {
        mode: 'profile',
        content: '',
        lastUpdated: serverTimestamp(),
        userId
      };
      
      await setDoc(modeRef, defaultMode);
      return defaultMode;
    }
  } catch (error) {
    console.error('Error getting user QR mode:', error);
    return null;
  }
}

/**
 * Update user's QR mode configuration
 */
export async function updateUserQRMode(
  userId: string, 
  mode: QRMode, 
  content: string
): Promise<boolean> {
  try {
    // Check if db is initialized
    if (!db) {
      console.error('Firestore is not initialized');
      return false;
    }
    
    const modeRef = doc(db, QR_MODES_COLLECTION, userId);
    
    const modeData: QRModeData = {
      mode,
      content,
      lastUpdated: serverTimestamp(),
      userId
    };
    
    await setDoc(modeRef, modeData);
    console.log('✅ QR mode updated:', { userId, mode, contentLength: content.length });
    return true;
  } catch (error) {
    console.error('❌ Error updating QR mode:', error);
    return false;
  }
}

/**
 * Validate note content
 */
export function validateNoteContent(noteData: NoteContent): { valid: boolean; error?: string } {
  if (!noteData.text || noteData.text.trim().length === 0) {
    return { valid: false, error: 'Not metni boş olamaz' };
  }
  
  if (noteData.text.length > 500) {
    return { valid: false, error: 'Not metni 500 karakterden uzun olamaz' };
  }
  
  if (noteData.title && noteData.title.length > 50) {
    return { valid: false, error: 'Not başlığı 50 karakterden uzun olamaz' };
  }
  
  return { valid: true };
}

/**
 * Validate song URL and extract platform info
 */
export function validateSongContent(songData: SongContent): { 
  valid: boolean; 
  error?: string; 
  platform?: 'spotify' | 'youtube' | 'other' 
} {
  if (!songData.url || songData.url.trim().length === 0) {
    return { valid: false, error: 'Şarkı URL\'si boş olamaz' };
  }
  
  try {
    const url = new URL(songData.url);
    
    // Spotify validation
    if (url.hostname.includes('spotify.com') || url.hostname.includes('open.spotify.com')) {
      if (url.pathname.includes('/track/') || url.pathname.includes('/album/') || url.pathname.includes('/playlist/')) {
        return { valid: true, platform: 'spotify' };
      } else {
        return { valid: false, error: 'Geçersiz Spotify linki. Track, album veya playlist linki olmalı.' };
      }
    }
    
    // YouTube validation
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      if (url.pathname.includes('/watch') || url.hostname.includes('youtu.be')) {
        return { valid: true, platform: 'youtube' };
      } else {
        return { valid: false, error: 'Geçersiz YouTube linki. Video linki olmalı.' };
      }
    }
    
    // Other platforms (basic URL validation)
    if (['http:', 'https:'].includes(url.protocol)) {
      return { valid: true, platform: 'other' };
    } else {
      return { valid: false, error: 'Güvenli olmayan protokol. HTTPS linki kullanın.' };
    }
    
  } catch (error) {
    return { valid: false, error: 'Geçersiz URL formatı' };
  }
}

/**
 * Parse Spotify URL to extract track/album/playlist info
 */
export function parseSpotifyUrl(url: string): { type: string; id: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    if (pathParts.length >= 3) {
      const type = pathParts[1]; // track, album, playlist
      const id = pathParts[2].split('?')[0]; // Remove query params
      
      return { type, id };
    }
  } catch (error) {
    console.error('Error parsing Spotify URL:', error);
  }
  
  return null;
}

/**
 * Parse YouTube URL to extract video ID
 */
export function parseYouTubeUrl(url: string): { videoId: string } | null {
  try {
    const urlObj = new URL(url);
    
    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return { videoId };
      }
    }
    
    // youtu.be/VIDEO_ID
    if (urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.substring(1);
      if (videoId) {
        return { videoId };
      }
    }
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
  }
  
  return null;
}

/**
 * Generate embed URL for supported platforms
 */
export function getEmbedUrl(songData: SongContent): string | null {
  const validation = validateSongContent(songData);
  if (!validation.valid || !validation.platform) return null;
  
  switch (validation.platform) {
    case 'spotify':
      const spotifyInfo = parseSpotifyUrl(songData.url);
      if (spotifyInfo) {
        return `https://open.spotify.com/embed/${spotifyInfo.type}/${spotifyInfo.id}`;
      }
      break;
      
    case 'youtube':
      const youtubeInfo = parseYouTubeUrl(songData.url);
      if (youtubeInfo) {
        return `https://www.youtube.com/embed/${youtubeInfo.videoId}`;
      }
      break;
      
    default:
      return songData.url; // Return original URL for other platforms
  }
  
  return null;
}

/**
 * Format QR mode for display
 */
export function formatQRModeDisplay(mode: QRMode): { label: string; icon: string; description: string } {
  switch (mode) {
    case 'profile':
      return {
        label: 'Profil',
        icon: '👤',
        description: 'QR tarandığında profil sayfan açılır'
      };
    case 'note':
      return {
        label: 'Not',
        icon: '📝',
        description: 'QR tarandığında özel notun gösterilir'
      };
    case 'song':
      return {
        label: 'Şarkı',
        icon: '🎵',
        description: 'QR tarandığında şarkın çalar'
      };
    default:
      return {
        label: 'Bilinmeyen',
        icon: '❓',
        description: 'Geçersiz mod'
      };
  }
}