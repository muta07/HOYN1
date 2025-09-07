# Hoyn QR System Deployment Guide

This document explains how to deploy the Hoyn QR System to both GitHub and Vercel.

## Prerequisites

1. Git installed and configured
2. Node.js and npm installed
3. Vercel CLI installed (will be installed automatically via npx if not present)
4. GitHub account
5. Vercel account

## Deployment Scripts

The project includes three PowerShell scripts for deployment:

### 1. deploy-all.ps1 (Recommended)
Deploys to both GitHub and Vercel in one command.

Usage:
```powershell
.\deploy-all.ps1
```

Or with parameters:
```powershell
.\deploy-all.ps1 -GithubUsername "your-username" -RepoName "your-repo" -VercelProjectName "your-vercel-project"
```

### 2. deploy-to-github.ps1
Deploys only to GitHub.

Usage:
```powershell
.\deploy-to-github.ps1
```

Or with parameters:
```powershell
.\deploy-to-github.ps1 -GithubUsername "your-username" -RepoName "your-repo"
```

### 3. setup-vercel-env.ps1
Sets up environment variables and deploys to Vercel.

Usage:
```powershell
.\setup-vercel-env.ps1
```

Or with parameter:
```powershell
.\setup-vercel-env.ps1 -VercelProjectName "your-vercel-project"
```

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### GitHub Deployment
1. Stage all changes: `git add .`
2. Commit changes: `git commit -m "Deployment message"`
3. Add/Update remote: `git remote add origin https://github.com/username/repository.git`
4. Push to GitHub: `git push -u origin main`

### Vercel Deployment
1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Deploy to Vercel: `npx vercel --prod`

## Environment Variables

The deployment scripts automatically configure the following environment variables for Vercel:

- Firebase configuration variables
- NEXT_PUBLIC_APP_URL
- HUGGING_FACE_API_TOKEN (optional)

If the automatic configuration fails, you'll need to set these manually in the Vercel dashboard.

## Troubleshooting

1. **Permission errors**: Make sure you have the necessary permissions for the GitHub repository and Vercel project.
2. **Build errors**: Check the console output for specific error messages and fix any code issues.
3. **Authentication issues**: Ensure you're logged into both GitHub and Vercel CLI.
4. **Network issues**: Check your internet connection and try again.

For any issues not covered here, please check the console output for specific error messages.