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
export async function createUserProfile(
  user: User, 
  displayName: string, 
  nickname?: string
): Promise<UserProfile> {
  const username = getUserUsername(user);
  const profile = {
    uid: user.uid,
    email: user.email!,
    displayName: displayName.trim(),
    username: username,
    nickname: nickname?.trim() || displayName.trim(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Check if Firebase is initialized
  if (db) {
    await setDoc(doc(db, 'users', user.uid), profile);
  }
  return profile;
}

/**
 * Gets user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Returning null user profile.');
    return null;
  }

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
): Promise<any> {
  const username = getUserUsername(user);
  const profile = {
    email: user.email!,
    companyName: companyName.trim(),
    ownerName: ownerName.trim(),
    nickname: nickname?.trim() || companyName.trim(),
    businessType: businessType.trim(),
    address: address?.trim(),
    phone: phone?.trim(),
    website: website?.trim(),
    description: description?.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: false
  };
  
  // Check if Firebase is initialized
  if (db) {
    await setDoc(doc(db, 'businesses', user.uid), profile);
  }
  return profile;
}

/**
 * Gets business profile from Firestore
 */
export async function getBusinessProfile(uid: string): Promise<BusinessProfile | null> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Returning null business profile.');
    return null;
  }

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
 * Updates business profile
 */
export async function updateBusinessProfile(uid: string, updates: Partial<BusinessProfile>): Promise<void> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Cannot update business profile.');
    return;
  }

  try {
    const docRef = doc(db, 'businesses', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating business profile:', error);
    throw error;
  }
}

/**
 * Updates user profile
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  // Check if Firebase is initialized
  if (!db) {
    console.warn('Firebase is not initialized. Cannot update user profile.');
    return;
  }

  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
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
 * Parses HOYN QR code data (v1.2+)
 * This function is robust and supports both URL-based and legacy JSON formats.
 */
export function parseHOYNQR(data: string): QRData | null {
  try {
    if (!validateQRData(data)) return null;

    // V2 (URL-based) format: https://hoyn.app/qr/v1?d=...
    if (data.includes('/qr/v1')) {
      const url = new URL(data);
      if (url.searchParams.has('d')) {
        const encodedData = url.searchParams.get('d')!;
        let decodedData: string;

        // Use Buffer in Node.js, atob in browser
        if (typeof window === 'undefined') {
          decodedData = Buffer.from(encodedData, 'base64url').toString('utf8');
        } else {
          const base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
          decodedData = decodeURIComponent(escape(window.atob(base64)));
        }

        const payload = JSON.parse(decodedData);

        // Validate payload
        if (payload.h && payload.u && payload.t) {
          console.log('🎯 Parsed HOYN QR v1.2 (URL format)', payload);
          return {
            type: payload.t,
            username: payload.u,
            data: payload,
            url: data
          };
        }
      }
    }

    // V1 (Legacy JSON) format check
    const sanitizedData = sanitizeQRData(data);
    if (sanitizedData.startsWith('{') && sanitizedData.endsWith('}')) {
      const parsed = JSON.parse(sanitizedData);
      if (parsed.hoyn && parsed.type && parsed.username) {
        console.log('🎯 Parsed HOYN QR v1.1 (Legacy JSON format)', parsed);
        return {
          type: parsed.type,
          username: parsed.username,
          url: parsed.url,
          data: parsed
        };
      }
    }

    return null;
  } catch (error) {
    // This is expected for non-Hoyn QR codes, so we don't log it as an error.
    return null;
  }
}

/**
 * Generates HOYN QR data (v1.2+ URL format)
 */
export function generateHOYNQR(
  username: string, 
  type: 'profile' | 'anonymous' = 'profile',
  mode?: 'profile' | 'note' | 'song'
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
  // Compact payload to keep URL short
  const payload = {
    h: true, // hoyn
    t: type, // type
    u: username, // username
    m: mode || 'profile', // mode
    v: '1.2' // version
  };

  const payloadString = JSON.stringify(payload);
  let encodedData: string;

  // Use Buffer in Node.js for server-side generation, btoa in browser
  if (typeof window === 'undefined') {
    encodedData = Buffer.from(payloadString).toString('base64url');
  } else {
    encodedData = btoa(unescape(encodeURIComponent(payloadString))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
  // The final URL that will be the content of the QR code
  const finalUrl = `${baseUrl}/qr/v1?d=${encodedData}`;
  console.log(`📦 Generated HOYN QR URL: ${finalUrl}`);
  
  return finalUrl;
}

/**
 * Generates profile-specific QR URL in the format https://hoyn-1.vercel.app/p/{profileId}
 */
export function generateProfileQRUrl(profileId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
  return `${baseUrl}/p/${profileId}`;
}

/**
 * Generates HOYN QR data with user's current mode
 */
export async function generateHOYNQRWithMode(username: string, userId?: string): Promise<string> {
  let userMode: 'profile' | 'note' | 'song' = 'profile';
  
  // If userId is provided, fetch their current QR mode
  if (userId) {
    try {
      const { getUserQRMode } = await import('./qr-modes');
      const qrModeData = await getUserQRMode(userId);
      if (qrModeData) {
        userMode = qrModeData.mode;
      }
    } catch (error) {
      console.warn('Failed to fetch user QR mode, using default profile mode:', error);
    }
  }
  
  return generateHOYNQR(username, 'profile', userMode);
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
