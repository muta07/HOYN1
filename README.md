# 🚀 HOYN! - Cyberpunk QR Identity Platform

**QR kodunla tanış, tişörtüne bas, dünyaya göster!**

## ✨ What is HOYN!?

HOYN! is a cutting-edge digital identity platform that bridges the physical and digital worlds through QR codes. Create your unique QR profile, print it on t-shirts, stickers, or anywhere you want, and let people connect with you in ways never possible before.

### 🎯 Core Features

- 🆔 **Digital Identity Cards** - Create comprehensive QR profiles
- 👕 **T-shirt Designer** - Design and print QR codes on merchandise
- 💬 **Anonymous Messaging** - Receive anonymous questions and messages
- 📱 **Mobile QR Scanner** - Built-in camera scanner
- 📊 **Analytics Dashboard** - Track QR scans and engagement
- 🎨 **Cyberpunk UI** - Stunning neon-themed interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with cyberpunk theme
- **Backend**: Firebase (Auth, Firestore, Storage)
- **QR Codes**: qrcode.react, @yudiel/react-qr-scanner
- **Security**: Rate limiting, CSP, XSS protection
- **Performance**: Lazy loading, memoization, dynamic imports
- **Hosting**: Vercel with global CDN

## 🎨 Design System

### Color Palette
- **Primary**: `#E040FB` (Neon Pink)
- **Secondary**: `#9C27B0` (Purple)
- **Background**: `#000000` (Black)
- **Font**: Orbitron (Cyberpunk style)

### UI Features
- ✨ Neon glow effects with pulsating animations
- 🌊 Glass morphism with backdrop blur
- 🎯 Floating animations for interactive elements
- ⚡ Cyberpunk borders with animated pulse effects
- 📏 Custom scrollbar with purple gradients

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hoyn-platform.git
cd hoyn-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── designer/          # T-shirt design tool
│   ├── scan/              # QR scanner
│   └── ask/[username]/    # Anonymous messaging
├── components/            # Reusable UI components
│   ├── ui/               # Core UI components
│   │   ├── NeonButton.tsx # Cyberpunk styled buttons
│   │   └── Loading.tsx    # Animated loading spinner
│   └── qr/               # QR related components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── firebase.ts       # Firebase setup
│   ├── constants.ts      # App constants
│   └── qr-utils.ts       # QR validation & utilities
└── styles/               # Global styles
```

## 🔐 Security Features

- **Rate Limiting**: 60 requests per minute per IP
- **Content Security Policy**: Prevents XSS attacks
- **Input Sanitization**: DOMPurify for user content
- **QR Validation**: Server-side QR code validation
- **Secure Headers**: XSS protection, frame options, etc.

## ⚡ Performance Optimizations

- **Lazy Loading**: QR components loaded on demand
- **Memoization**: React.memo for expensive components
- **Dynamic Imports**: Code splitting for better load times
- **Image Optimization**: Ready for next/image
- **Bundle Analysis**: Optimized chunk sizes

## 🎨 UI Components

### NeonButton
```tsx
<NeonButton 
  variant="primary" 
  size="lg" 
  glow
  onClick={handleClick}
>
  🚀 Get Started
</NeonButton>
```

### Loading Spinner
```tsx
<Loading size="md" text="Loading HOYN!..." />
```

### QR Code Generator
```tsx
<QRCodeWrapper
  value="https://hoyn.app/u/username"
  size={256}
  fgColor="#E040FB"
  bgColor="#000000"
  logo="/logo.png"
/>
```

## 📊 Analytics & Tracking

- QR scan analytics
- User engagement metrics
- Geographic data (optional)
- Device information
- Performance monitoring

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables
3. Deploy automatically on every push

### Manual Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Next.js team for the amazing framework
- Firebase for the backend infrastructure
- Tailwind CSS for the utility-first styling
- The cyberpunk aesthetic community for inspiration

---

**HOYN! - Where physical meets digital** 💜

Made with ❤️ and lots of ☕