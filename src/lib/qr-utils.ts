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
 * Updates user profile nickname
 */
export async function updateUserNickname(uid: string, nickname: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      nickname: nickname.trim(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user nickname:', error);
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
    ? 'https://hoyn-1.vercel.app' 
    : `http://localhost:${process.env.PORT || 3000}`;
    
  const url = type === 'profile' 
    ? `${baseUrl}/u/${username}` 
    : `${baseUrl}/ask/${username}`;
    
  // Create HOYN! formatted QR JSON
  const hoynData = {
    hoyn: true,
    type: type,
    url: url,
    username: username,
    createdAt: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(hoynData);
}

/**
 * Downloads QR code as image using html2canvas
 */
export async function downloadQRCode(
  elementId: string, 
  filename: string = 'hoyn-qr-code',
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error('QR code element not found');
    }

    // First try with html2canvas
    try {
      const { default: html2canvas } = await import('html2canvas');
      
      const canvas = await html2canvas(element, {
        backgroundColor: format === 'jpeg' ? '#FFFFFF' : null,
        scale: 3, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        height: element.offsetHeight,
        width: element.offsetWidth,
        onclone: (clonedDoc) => {
          // Remove any problematic elements in clone
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            // Remove any absolute positioned elements that might cause issues
            const problematicElements = clonedElement.querySelectorAll('[style*="absolute"]');
            problematicElements.forEach(el => {
              if (el.textContent?.includes('QR:') || el.textContent?.includes('✓')) {
                el.remove();
              }
            });
          }
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      
      if (format === 'jpeg') {
        link.href = canvas.toDataURL('image/jpeg', 0.95);
      } else {
        link.href = canvas.toDataURL('image/png');
      }
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ QR Code downloaded as ${format.toUpperCase()}`);
      
    } catch (html2canvasError) {
      console.warn('html2canvas failed, trying fallback method:', html2canvasError);
      
      // Fallback: Try to find SVG or Canvas directly
      await downloadQRFallback(element, filename, format);
    }
    
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw new Error(`QR indirme başarısız: ${(error as Error).message}`);
  }
}

// Fallback download method for CORS issues
async function downloadQRFallback(
  element: HTMLElement, 
  filename: string, 
  format: 'png' | 'jpeg'
): Promise<void> {
  try {
    // Look for SVG or Canvas element
    const svgElement = element.querySelector('svg');
    const canvasElement = element.querySelector('canvas');
    
    if (canvasElement) {
      // Direct canvas download
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      
      if (format === 'jpeg') {
        link.href = canvasElement.toDataURL('image/jpeg', 0.95);
      } else {
        link.href = canvasElement.toDataURL('image/png');
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } else if (svgElement) {
      // Convert SVG to canvas and download
      await downloadSVGAsImage(svgElement, filename, format);
      
    } else {
      throw new Error('No SVG or Canvas element found for fallback download');
    }
    
    console.log(`✅ QR Code downloaded using fallback method as ${format.toUpperCase()}`);
    
  } catch (error) {
    console.error('Fallback download failed:', error);
    throw error;
  }
}

// Convert SVG to image and download
async function downloadSVGAsImage(
  svgElement: SVGElement, 
  filename: string, 
  format: 'png' | 'jpeg'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          canvas.width = img.width * 2; // Higher resolution
          canvas.height = img.height * 2;
          
          // Set background for JPEG
          if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const link = document.createElement('a');
          link.download = `${filename}.${format}`;
          
          if (format === 'jpeg') {
            link.href = canvas.toDataURL('image/jpeg', 0.95);
          } else {
            link.href = canvas.toDataURL('image/png');
          }
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(svgUrl);
          resolve();
          
        } catch (error) {
          URL.revokeObjectURL(svgUrl);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Failed to load SVG as image'));
      };
      
      img.src = svgUrl;
      
    } catch (error) {
      reject(error);
    }
  });
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