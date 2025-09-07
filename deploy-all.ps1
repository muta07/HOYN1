# Comprehensive Deployment Script for Hoyn QR System
# Deploys to both GitHub and Vercel

param(
    [string]$GithubUsername,
    [string]$RepoName,
    [string]$VercelProjectName
)

Write-Host "🚀 Hoyn QR System - Complete Deployment Script" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Function to prompt for input if not provided
function Get-InputIfMissing {
    param([string]$Value, [string]$Prompt)
    if (-not $Value) {
        $Value = Read-Host $Prompt
    }
    return $Value
}

# Get required information
$GithubUsername = Get-InputIfMissing $GithubUsername "Enter your GitHub username"
$RepoName = Get-InputIfMissing $RepoName "Enter your GitHub repository name"
$VercelProjectName = Get-InputIfMissing $VercelProjectName "Enter your Vercel project name (or press Enter to use '$RepoName')"

if (-not $VercelProjectName) {
    $VercelProjectName = $RepoName
}

Write-Host "`n📋 Deployment Information:" -ForegroundColor Cyan
Write-Host "GitHub Username: $GithubUsername" -ForegroundColor Gray
Write-Host "GitHub Repository: $RepoName" -ForegroundColor Gray
Write-Host "Vercel Project: $VercelProjectName" -ForegroundColor Gray

# Confirm before proceeding
Write-Host "`n⚠️  This will commit all changes and deploy to both GitHub and Vercel." -ForegroundColor Yellow
$confirmation = Read-Host "Do you want to continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Stage all changes
Write-Host "`n📦 Staging all changes..." -ForegroundColor Cyan
git add .

# Commit changes
Write-Host "📝 Creating commit..." -ForegroundColor Cyan
git commit -m "Deploy all files: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Set the remote origin for GitHub
Write-Host "🔗 Setting GitHub remote..." -ForegroundColor Cyan
git remote add origin "https://github.com/$GithubUsername/$RepoName.git" 2>$null
git remote set-url origin "https://github.com/$GithubUsername/$RepoName.git"

# Push to GitHub
Write-Host "🚀 Pushing code to GitHub..." -ForegroundColor Cyan
Write-Host "This may take a few minutes depending on your connection speed." -ForegroundColor Gray

try {
    git push -u origin --all
    git push -u origin --tags
    Write-Host "✅ GitHub deployment completed!" -ForegroundColor Green
    Write-Host "Your repository is available at: https://github.com/$GithubUsername/$RepoName" -ForegroundColor Blue
} catch {
    Write-Host "❌ Error during GitHub deployment: $_" -ForegroundColor Red
    exit 1
}

# Build the Next.js project for Vercel deployment
Write-Host "`n🏗️  Building Next.js project for Vercel deployment..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during build: $_" -ForegroundColor Red
    exit 1
}

# Setup Vercel environment variables
Write-Host "`n🔧 Setting up Vercel Environment Variables..." -ForegroundColor Cyan

# Firebase Configuration
try {
    Write-Host "Setting Firebase environment variables..." -ForegroundColor Gray
    npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY "AIzaSyDJN3wqeaNxmk9l1I3Lg3KD8r2G6ziMZxM" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "hoyn-demo.firebaseapp.com" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL "https://hoyn-demo-default-rtdb.firebaseio.com" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID "hoyn-demo" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "hoyn-demo.firebasestorage.app" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "818752786451" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID "1:818752786451:web:d3dc938ad4ee898a9d6fe6" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID "G-HQ6KYZZPQG" --environment=production --git-branch main 2>$null
} catch {
    Write-Host "⚠️  Warning: Could not set Firebase environment variables. You may need to set them manually in Vercel dashboard." -ForegroundColor Yellow
}

# App URL
try {
    Write-Host "Setting app URL environment variable..." -ForegroundColor Gray
    npx vercel env add NEXT_PUBLIC_APP_URL "https://$VercelProjectName.vercel.app" --environment=production --git-branch main 2>$null
} catch {
    Write-Host "⚠️  Warning: Could not set app URL environment variable." -ForegroundColor Yellow
}

# Hugging Face API Configuration
Write-Host "`n🤗 Setting up Hugging Face API..." -ForegroundColor Yellow
Write-Host "Please get your Hugging Face API token from: https://huggingface.co/settings/tokens" -ForegroundColor Cyan
$hfToken = Read-Host "Enter your Hugging Face API Token (or press Enter to skip)"
if ($hfToken) {
    try {
        npx vercel env add HUGGING_FACE_API_TOKEN "$hfToken" --environment=production --git-branch main 2>$null
        Write-Host "✅ Hugging Face API token configured!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Warning: Could not set Hugging Face token. You may need to set it manually in Vercel dashboard." -ForegroundColor Yellow
    }
 else {
    Write-Host "⚠️  Warning: No Hugging Face token provided. AI QR generation will use fallback mode." -ForegroundColor Yellow
}

# Deploy to Vercel
Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Cyan
try {
    # Link the project to Vercel if not already linked
    Write-Host "Linking project to Vercel..." -ForegroundColor Gray
    npx vercel link --project $VercelProjectName --yes 2>$null
    
    # Deploy to production
    Write-Host "Deploying to production..." -ForegroundColor Gray
    npx vercel --prod --yes
    
    Write-Host "`n🎉 Vercel deployment completed!" -ForegroundColor Green
    Write-Host "Your application is available at: https://$VercelProjectName.vercel.app" -ForegroundColor Blue
} catch {
    Write-Host "❌ Error during Vercel deployment: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Complete Deployment Process Finished!" -ForegroundColor Green
Write-Host "GitHub Repository: https://github.com/$GithubUsername/$RepoName" -ForegroundColor Blue
Write-Host ("Vercel Application: https://" + $VercelProjectName + ".vercel.app") -ForegroundColor Blue

