# Setup Vercel Environment Variables
param(
    [string]$VercelProjectName
)

Write-Host "🔧 Setting up Vercel Environment Variables..." -ForegroundColor Green

# Function to prompt for input if not provided
function Get-InputIfMissing {
    param([string]$Value, [string]$Prompt)
    if (-not $Value) {
        $Value = Read-Host $Prompt
    }
    return $Value
}

# Get Vercel project name if not provided
$VercelProjectName = Get-InputIfMissing $VercelProjectName "Enter your Vercel project name (or press Enter to use default)"

# Build the Next.js project first
Write-Host "🏗️  Building Next.js project..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during build: $_" -ForegroundColor Red
    Write-Host "Cannot proceed with deployment without successful build." -ForegroundColor Red
    exit 1
}

# Firebase Configuration
Write-Host "🔐 Setting Firebase environment variables..." -ForegroundColor Cyan
try {
    npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY "AIzaSyDJN3wqeaNxmk9l1I3Lg3KD8r2G6ziMZxM" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "hoyn-demo.firebaseapp.com" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL "https://hoyn-demo-default-rtdb.firebaseio.com" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID "hoyn-demo" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "hoyn-demo.firebasestorage.app" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "818752786451" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID "1:818752786451:web:d3dc938ad4ee898a9d6fe6" --environment=production --git-branch main 2>$null
    npx vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID "G-HQ6KYZZPQG" --environment=production --git-branch main 2>$null
    Write-Host "✅ Firebase environment variables configured!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not set Firebase environment variables automatically. You may need to set them manually in Vercel dashboard." -ForegroundColor Yellow
}

# App URL
Write-Host "🌐 Setting app URL environment variable..." -ForegroundColor Cyan
try {
    if (-not $VercelProjectName) {
        $VercelProjectName = "hoyn-app"
    }
    npx vercel env add NEXT_PUBLIC_APP_URL "https://$VercelProjectName.vercel.app" --environment=production --git-branch main 2>$null
    Write-Host "✅ App URL configured!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not set app URL environment variable." -ForegroundColor Yellow
}

# Hugging Face API Configuration
Write-Host "🤗 Setting up Hugging Face API..." -ForegroundColor Yellow
Write-Host "Please get your Hugging Face API token from: https://huggingface.co/settings/tokens" -ForegroundColor Cyan
$hfToken = Read-Host "Enter your Hugging Face API Token (or press Enter to skip)"
if ($hfToken) {
    try {
        npx vercel env add HUGGING_FACE_API_TOKEN "$hfToken" --environment=production --git-branch main 2>$null
        Write-Host "✅ Hugging Face API token configured!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Warning: Could not set Hugging Face token automatically. You may need to set it manually in Vercel dashboard." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Warning: No Hugging Face token provided. AI QR generation will use fallback mode." -ForegroundColor Yellow
}

Write-Host "✅ Environment variables configured!" -ForegroundColor Green
Write-Host "🚀 Now deploying to production..." -ForegroundColor Yellow

# Link project if needed
Write-Host "🔗 Linking project to Vercel..." -ForegroundColor Cyan
if ($VercelProjectName) {
    npx vercel link --project $VercelProjectName --yes 2>$null
} else {
    npx vercel link --yes 2>$null
}

# Deploy to production
try {
    npx vercel --prod --yes
    Write-Host "🎉 Deployment complete!" -ForegroundColor Green
    if ($VercelProjectName) {
        Write-Host "Your application is available at: https://$VercelProjectName.vercel.app" -ForegroundColor Blue
    }
} catch {
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
    exit 1
}