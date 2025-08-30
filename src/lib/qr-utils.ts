// src/lib/qr-utils.ts
// @ts-ignore - DOMPurify types
import DOMPurify from 'isomorphic-dompurify';

export interface QRData {
  type: 'profile' | 'anonymous' | 'custom';
  username?: string;
  url?: string;
  data?: any;
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