# Setup Vercel Environment Variables
Write-Host "🔧 Setting up Vercel Environment Variables..." -ForegroundColor Cyan

# Firebase Configuration
npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY "AIzaSyDJN3wqeaNxmk9l1I3Lg3KD8r2G6ziMZxM" --environment=production
npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "hoyn-demo.firebaseapp.com" --environment=production
npx vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL "https://hoyn-demo-default-rtdb.firebaseio.com" --environment=production
npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID "hoyn-demo" --environment=production
npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "hoyn-demo.firebasestorage.app" --environment=production
npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "818752786451" --environment=production
npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID "1:818752786451:web:d3dc938ad4ee898a9d6fe6" --environment=production
npx vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID "G-HQ6KYZZPQG" --environment=production

# Application Settings
npx vercel env add NEXT_PUBLIC_APP_URL "https://your-app-name.vercel.app" --environment=production
npx vercel env add NEXT_PUBLIC_APP_NAME "HOYN!" --environment=production

# Security Settings
Write-Host "🔐 Setting up security configuration..." -ForegroundColor Yellow
$nextAuthSecret = Read-Host "Enter your NEXTAUTH_SECRET (or press Enter to generate one)"
if (-not $nextAuthSecret) {
    # Generate a random secret
    $nextAuthSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "Generated NEXTAUTH_SECRET: $nextAuthSecret" -ForegroundColor Cyan
}
npx vercel env add NEXTAUTH_SECRET "$nextAuthSecret" --environment=production
npx vercel env add NEXTAUTH_URL "https://your-app-name.vercel.app" --environment=production

# Hugging Face API Configuration
Write-Host "🤗 Setting up Hugging Face API..." -ForegroundColor Yellow
Write-Host "Please get your Hugging Face API token from: https://huggingface.co/settings/tokens" -ForegroundColor Cyan
$hfToken = Read-Host "Enter your Hugging Face API Token"
if ($hfToken) {
    npx vercel env add HUGGING_FACE_API_TOKEN "$hfToken" --environment=production
    Write-Host "✅ Hugging Face API token configured!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: No Hugging Face token provided. AI QR generation will use fallback mode." -ForegroundColor Yellow
}

Write-Host "✅ Environment variables configured!" -ForegroundColor Green
Write-Host "🚀 Now deploying to production..." -ForegroundColor Yellow

# Deploy to production
npx vercel --prod

Write-Host "🎉 Deployment complete!" -ForegroundColor Green