// src/lib/qr-utils.ts
// @ts-ignore - DOMPurify types
import DOMPurify from 'isomorphic-dompurify';
import { User } from 'firebase/auth';
import { UserProfile, BusinessProfile, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface QRData {
  type: 'profile' | 'anonymous' | 'custom';
  username?: string;
  url?: string;
  data?: any;
}

/**
 * Gets user display name with nickname priority (supports both user and business)
 */
export function getUserDisplayName(user: User | null, profile?: UserProfile | BusinessProfile | null): string {
  if (!user) return 'kullanıcı';
  
  // Önce profile'dan nickname'e bak
  if (profile?.nickname && profile.nickname.trim()) {
    return profile.nickname.trim();
  }
  
  // Sonra displayName'e bak (kayıt sırasında ayarlanan gerçek ad)
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  
  // Email varsa @ işaretinden öncesini al
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'kullanıcı';
}

/**
 * Gets username for URL purposes (always from email)
 */
export function getUserUsername(user: User | null): string {
  if (!user || !user.email) return '';
  return user.email.split('@')[0];
}

/**
 * Creates user profile in Firestore
 */
export async function createUserProfile(user: User, displayName: string, nickname?: string): Promise<UserProfile> {
  const username = getUserUsername(user);
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName: displayName.trim(),
    nickname: nickname?.trim() || displayName.trim(),
    username,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

/**
 * Gets user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Creates business profile in Firestore
 */
export async function createBusinessProfile(
  user: User, 
  companyName: string, 
  ownerName: string,
  nickname: string,
  businessType: string,
  address?: string,
  phone?: string,
  website?: string,
  description?: string
): Promise<BusinessProfile> {
  const username = getUserUsername(user);
  const profile: BusinessProfile = {
    uid: user.uid,
    email: user.email!,
    companyName: companyName.trim(),
    ownerName: ownerName.trim(),
    nickname: nickname?.trim() || companyName.trim(),
    businessType: businessType.trim(),
    address: address?.trim(),
    phone: phone?.trim(),
    website: website?.trim(),
    description: description?.trim(),
    username,
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: false
  };
  
  await setDoc(doc(db, 'businesses', user.uid), profile);
  return profile;
}

/**
 * Gets business profile from Firestore
 */
export async function getBusinessProfile(uid: string): Promise<BusinessProfile | null> {
  try {
    const docRef = doc(db, 'businesses', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as BusinessProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting business profile:', error);
    return null;
  }
}

/**
 * Updates business profile nickname
 */
export async function updateBusinessNickname(uid: string, nickname: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', uid);
    await updateDoc(docRef, {
      nickname: nickname.trim(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating business nickname:', error);
    throw error;
  }
}

/**
 * Validates QR code data for security
 */
export function validateQRData(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  
  // Check length limits
  if (data.length > 500) return false;
  
  // Check for malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];
  
  return !maliciousPatterns.some(pattern => pattern.test(data));
}

/**
 * Sanitizes QR data content
 */
export function sanitizeQRData(data: string): string {
  return DOMPurify.sanitize(data, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Parses HOYN QR code data
 */
export function parseHOYNQR(data: string): QRData | null {
  try {
    // Validate first
    if (!validateQRData(data)) return null;
    
    const sanitizedData = sanitizeQRData(data);
    
    // Check if it's a HOYN profile URL
    const profileMatch = sanitizedData.match(/^https:\/\/hoyn\.app\/u\/([a-zA-Z0-9_-]+)$/);
    if (profileMatch) {
      return {
        type: 'profile',
        username: profileMatch[1],
        url: sanitizedData
      };
    }
    
    // Check if it's a HOYN anonymous URL
    const anonymousMatch = sanitizedData.match(/^https:\/\/hoyn\.app\/ask\/([a-zA-Z0-9_-]+)$/);
    if (anonymousMatch) {
      return {
        type: 'anonymous',
        username: anonymousMatch[1],
        url: sanitizedData
      };
    }
    
    // Check if it's JSON data
    if (sanitizedData.startsWith('{') && sanitizedData.endsWith('}')) {
      try {
        const parsed = JSON.parse(sanitizedData);
        if (parsed.hoyn && parsed.type) {
          return {
            type: 'custom',
            data: parsed
          };
        }
      } catch {
        // Not valid JSON, treat as custom URL
      }
    }
    
    // Treat as custom URL
    if (sanitizedData.startsWith('http://') || sanitizedData.startsWith('https://')) {
      return {
        type: 'custom',
        url: sanitizedData
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
}

/**
 * Generates HOYN QR data
 */
export function generateHOYNQR(username: string, type: 'profile' | 'anonymous' = 'profile'): string {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://hoyn.app' 
    : 'http://localhost:3000';
    
  switch (type) {
    case 'profile':
      return `${baseUrl}/u/${username}`;
    case 'anonymous':
      return `${baseUrl}/ask/${username}`;
    default:
      return `${baseUrl}/u/${username}`;
  }
}

/**
 * Downloads QR code as image using html2canvas
 */
export async function downloadQRCode(elementId: string, filename: string = 'hoyn-qr-code'): Promise<void> {
  try {
    // @ts-ignore - html2canvas types
    const { default: html2canvas } = await import('html2canvas');
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error('QR code element not found');
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#000000',
      scale: 2, // Higher quality
      useCORS: true
    });
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw new Error('Failed to download QR code');
  }
}

/**
 * Tracks QR code scan analytics
 */
export async function trackQRScan(qrData: QRData, scannerInfo?: any): Promise<void> {
  try {
    // This would typically send to your analytics service
    const analyticsData = {
      type: 'qr_scan',
      qrType: qrData.type,
      username: qrData.username,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...scannerInfo
    };
    
    // Send to Firebase Analytics or your preferred service
    console.log('QR Scan tracked:', analyticsData);
    
    // Example: Send to API endpoint
    // await fetch('/api/analytics/qr-scan', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(analyticsData)
    // });
  } catch (error) {
    console.error('Error tracking QR scan:', error);
  }
}