# Hoyn QR System - Vercel Deployment Guide

## Overview
This document provides instructions for deploying the Hoyn QR System to Vercel. The application is a Next.js project with Firebase integration that requires specific environment configurations for successful deployment.

## Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Vercel account
- GitHub account
- Firebase project with configured services

## Deployment Methods

### Method 1: Automated Deployment (Recommended)
1. Run the setup script to configure environment variables:
   ```powershell
   .\setup-vercel-env.ps1
   ```

2. Deploy to GitHub:
   ```powershell
   .\deploy-to-github.ps1
   ```

3. Connect your GitHub repository to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Create a new project
   - Connect your GitHub repository
   - Configure project settings as specified in the Vercel configuration section

### Method 2: Manual Deployment
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to preview:
   ```bash
   vercel
   ```

4. Deploy to production:
   ```bash
   vercel --prod
   ```

## Vercel Configuration

### Project Settings
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: Automatically detected
- Install Command: `npm install`
- Development Command: `npm run dev`

### Environment Variables
Set the following environment variables in the Vercel dashboard:

1. `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
3. `NEXT_PUBLIC_FIREBASE_DATABASE_URL` - Firebase database URL
4. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
5. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
6. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
7. `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
8. `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID
9. `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL
10. `NEXT_PUBLIC_APP_NAME` - Application name (HOYN!)
11. `NEXTAUTH_SECRET` - Generated secret key
12. `NEXTAUTH_URL` - Your Vercel deployment URL

Optional variables:
- `HUGGING_FACE_API_TOKEN` - For AI QR generation features

## Custom Domain Configuration (Optional)
1. Add custom domain in Vercel project settings
2. Configure DNS records as provided by Vercel
3. Enable SSL certificate provisioning

## Post-deployment Verification
After deployment, verify the following functionality:
- QR code generation
- QR code scanning
- Authentication flows
- Real-time messaging
- Profile customization
- Business profiles
- T-shirt designer

## Troubleshooting
Common issues and solutions:
- **Build failures**: Check environment variables and dependency versions
- **Runtime errors**: Verify Firebase configuration
- **Performance issues**: Review bundle size and optimization settings

## Monitoring
Refer to [MONITORING_ANALYTICS.md](file:///c%3A/Users/MSI/OneDrive/Masa%C3%BCst%C3%BC/hoyn%20denemeleri/hoyn1/MONITORING_ANALYTICS.md) for detailed monitoring and analytics setup instructions.

## Maintenance
Regular maintenance tasks:
- Update dependencies
- Monitor performance metrics
- Review security settings
- Check error logs

For detailed deployment procedures, refer to [DEPLOYMENT_CHECKLIST.md](file:///c%3A/Users/MSI/OneDrive/Masa%C3%BCst%C3%BC/hoyn%20denemeleri/hoyn1/DEPLOYMENT_CHECKLIST.md).