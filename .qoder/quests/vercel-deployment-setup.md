# Vercel Deployment Setup for HOYN Project

## Overview

This document provides a comprehensive guide for deploying the HOYN project to Vercel while maintaining the current UI/UX structure and ensuring all backend functionality (Firebase auth, messaging, QR code system) works seamlessly. The deployment process focuses on proper environment variable configuration and Next.js-Firebase integration.

## Architecture

The HOYN application follows a standard Next.js 14 App Router architecture with Firebase integration:

```mermaid
graph TD
    A[Client Browser] --> B[Vercel Hosting]
    B --> C[Next.js Application]
    C --> D[Firebase Services]
    D --> E[Firebase Authentication]
    D --> F[Cloud Firestore]
    D --> G[Firebase Realtime Database]
    D --> H[Cloud Storage]
```

## Environment Variables Configuration

### Required Environment Variables

For successful Vercel deployment, the following environment variables must be configured:

#### Firebase Configuration (Public - Client-side)
These variables are prefixed with `NEXT_PUBLIC_` to be accessible in the browser:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

#### Server-side Configuration (Private)
These variables should NOT be prefixed with `NEXT_PUBLIC_` as they contain sensitive information:

- `HUGGING_FACE_API_TOKEN` (for AI QR generation)

#### Application Settings
- `NEXT_PUBLIC_APP_URL` (should be set to `https://hoyn-1.vercel.app` in production)
- `NEXT_PUBLIC_APP_NAME` (set to "HOYN!")

### Manual Configuration Steps

! You must manually perform the following steps:

1. ! Log in to your Vercel dashboard
2. ! Navigate to your project settings
3. ! Go to the "Environment Variables" section
4. ! Add all the required environment variables listed above with their appropriate values
5. ! Ensure `NEXT_PUBLIC_APP_URL` is set to `https://hoyn-1.vercel.app` for production

## Next.js Configuration

The project's `next.config.js` file is already configured for optimal deployment:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@yudiel/react-qr-scanner', 'qrcode.react']
  },
  
  // Image optimization for better performance
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Disable ESLint during build to prevent deployment issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Production URL configuration
  async redirects() {
    return [
      // Add any redirects here if needed
    ]
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

## Firebase Integration

### Client-side Firebase Configuration

The Firebase configuration in `src/lib/firebase.ts` is designed to work with Vercel deployments:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDJN3wqeaNxmk9l1I3Lg3KD8r2G6ziMZxM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hoyn-demo.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://hoyn-demo-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hoyn-demo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hoyn-demo.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "818752786451",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:818752786451:web:d3dc938ad4ee898a9d6fe6",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HQ6KYZZPQG"
};
```

### Firebase Security Rules

Ensure your Firestore security rules in `firestore.rules` properly protect your data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read their own profile
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Allow users to read business profiles
    match /businesses/{businessId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    
    // Allow users to read profiles
    match /profiles/{profileId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    
    // Messages collection rules
    match /messages/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // QR scans collection rules
    match /qrScans/{document=**} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

## Build Process and Deployment

### Build-time vs Runtime Configuration

To prevent "Yükleniyor..." errors and configuration issues:

1. **Build-time Configuration**: Environment variables needed during the build process must be set in Vercel before deployment
2. **Runtime Configuration**: Environment variables used during application runtime are injected at runtime by Vercel

### Deployment Steps

! Manual deployment steps you need to perform:

1. ! Ensure all environment variables are set in Vercel dashboard
2. ! Commit and push your code to your Git repository
3. ! Connect your repository to Vercel if not already done
4. ! Trigger a new deployment in Vercel
5. ! Monitor the build logs for any errors

### Troubleshooting Common Issues

If you encounter "Yükleniyor..." errors or configuration issues:

1. ! Verify all Firebase environment variables are correctly set in Vercel
2. ! Check that `NEXT_PUBLIC_APP_URL` is set to `https://hoyn-1.vercel.app`
3. ! Ensure the Firebase project settings match the environment variables
4. ! Check Vercel build logs for specific error messages

## QR Code System Integration

The QR code system is fully compatible with Vercel deployment:

- QR generation using `qrcode.react` works client-side
- QR scanning using `@yudiel/react-qr-scanner` works in the browser
- AI QR generation with Hugging Face API requires the `HUGGING_FACE_API_TOKEN` environment variable

### QR Code Format

QR codes follow the HOYN format:
```json
{
  "app": "HOYN",
  "type": "profile",
  "version": "1.0",
  "profileId": "user-profile-id",
  "username": "user-username",
  "timestamp": "ISO-timestamp"
}
```

## Messaging System

The real-time messaging system uses Firebase Realtime Database and works seamlessly with Vercel:

- Messages are stored in the `messages` collection in Firestore
- Real-time updates are handled through Firebase listeners
- Anonymous messaging functionality is preserved

## Security Considerations

1. Only public Firebase configuration values should be prefixed with `NEXT_PUBLIC_`
2. The Hugging Face API token should remain server-side only
3. Firestore security rules protect data access
4. All API routes are protected with proper authentication checks

## Testing Deployment

After deployment, verify the following:

1. Authentication flows work correctly
2. QR code generation and scanning function properly
3. Messaging system operates as expected
4. All pages load without "Yükleniyor..." errors
5. Environment variables are correctly loaded

## Additional Notes

- The existing cyberpunk UI/UX theme is preserved during deployment
- All existing functionality (dashboard, profile management, QR features) continues to work
- No changes to the codebase structure are required for Vercel compatibility