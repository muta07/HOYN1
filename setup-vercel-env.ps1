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

Write-Host "✅ Environment variables configured!" -ForegroundColor Green
Write-Host "🚀 Now deploying to production..." -ForegroundColor Yellow

# Deploy to production
npx vercel --prod

Write-Host "🎉 Deployment complete!" -ForegroundColor Green