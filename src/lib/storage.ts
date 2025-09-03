// src/lib/storage.ts
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  url: string;
  fileName: string;
  fullPath: string;
  size: number;
}

/**
 * Upload user mockup to Firebase Storage
 */
export async function uploadUserMockup(
  userId: string, 
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `mockup_${timestamp}.${fileExtension}`;
    const filePath = `user-mockups/${userId}/${fileName}`;

    // Create storage reference
    const storageRef = ref(storage, filePath);

    // Simulate progress for now (Firebase Web SDK doesn't have built-in progress for small files)
    if (onProgress) {
      onProgress(0);
      setTimeout(() => onProgress(50), 100);
    }

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    if (onProgress) {
      onProgress(100);
    }

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ File uploaded successfully:', {
      fileName,
      fullPath: filePath,
      size: file.size,
      url: downloadURL
    });

    return {
      url: downloadURL,
      fileName,
      fullPath: filePath,
      size: file.size
    };

  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

/**
 * Delete user mockup from Firebase Storage
 */
export async function deleteUserMockup(fullPath: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
    
    console.log('✅ File deleted successfully:', fullPath);
    return true;
  } catch (error) {
    console.error('❌ Delete error:', error);
    return false;
  }
}

/**
 * List user's uploaded mockups
 */
export async function getUserMockups(userId: string): Promise<UploadResult[]> {
  try {
    const userMockupsRef = ref(storage, `user-mockups/${userId}`);
    const listResult = await listAll(userMockupsRef);
    
    const mockups: UploadResult[] = [];
    
    for (const itemRef of listResult.items) {
      try {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        
        mockups.push({
          url,
          fileName: itemRef.name,
          fullPath: itemRef.fullPath,
          size: metadata.size || 0
        });
      } catch (error) {
        console.warn('❌ Error getting mockup details:', itemRef.name, error);
      }
    }
    
    console.log('✅ Retrieved user mockups:', mockups.length);
    return mockups;

  } catch (error) {
    console.error('❌ Error listing user mockups:', error);
    return [];
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // File type validation
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Only image files are allowed' };
  }

  // Supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, WebP' };
  }

  // Size validation (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Minimum size validation (to prevent tiny images)
  if (file.size < 1024) {
    return { valid: false, error: 'File is too small (minimum 1KB)' };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}