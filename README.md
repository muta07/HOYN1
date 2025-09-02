# 🎆 HOYN! Digital Identity Platform

[![Vercel](https://vercelbadge.vercel.app/api/talhas-projects-a5d216a6/hoyn-1)](https://hoyn-1.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.12.3-yellow)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

HOYN! is a cutting-edge digital identity platform that bridges the physical and digital worlds through QR codes. Users can create scannable QR profiles for t-shirts, business cards, and other physical items, enabling seamless digital interactions.

## 🚀 Live Demo

**Production URL**: https://hoyn-1.vercel.app

## ✨ Features

### 🔐 Authentication System
- **Email/Password** registration and login
- **Google OAuth** integration
- **Business accounts** with company profiles
- **Personal accounts** with nickname system
- Secure Firebase authentication

### 📱 QR Code Generation
- **Profile QR codes** linking to user pages
- **Anonymous messaging QR codes** for secret communication
- **Custom URL QR codes** with HOYN! branding
- **AI-powered QR art generation** using Hugging Face
- Customizable colors, sizes, and logo integration
- Download in PNG/JPEG formats

### 💬 Communication Features
- **Anonymous messaging** system
- Real-time message delivery
- User-to-user direct communication
- Privacy-focused interactions

### 👕 T-shirt Designer
- **Drag-and-drop** design interface
- **QR code integration** on apparel
- Custom design templates
- Print-ready exports

### 🎨 Cyberpunk Theme
- **Neon aesthetic** with purple/pink gradients
- **Orbitron font** for futuristic typography
- **Glow effects** and animations
- **Responsive design** for all devices

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Custom hooks** for state management

### Backend & Services
- **Firebase Authentication** for user management
- **Firebase Firestore** for document storage
- **Firebase Realtime Database** for messaging
- **Hugging Face API** for AI QR generation

### QR Code Libraries
- **qrcode.react** for QR generation
- **@yudiel/react-qr-scanner** for QR scanning
- **html2canvas** for QR downloads
- **isomorphic-dompurify** for security

### Deployment
- **Vercel** for hosting and CDN
- **GitHub** for version control
- **Environment variables** for configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Vercel account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hoyn1.git
   cd hoyn1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Hugging Face API (optional)
   HUGGING_FACE_API_TOKEN=your_hf_token
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── designer/          # T-shirt designer
│   │   └── scan/             # QR scanner
│   ├── components/            # React components
│   │   ├── qr/               # QR-related components
│   │   ├── ui/               # UI components
│   │   └── designer/         # Design components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and configurations
│   └── styles/               # Global styles
├── public/                   # Static assets
└── configuration files
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Email/Password + Google)
3. Set up Firestore Database
4. Enable Realtime Database
5. Copy configuration to environment variables

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

## 🎯 Key Components

### Authentication (`useAuth` hook)
- Manages user state and authentication
- Handles login, logout, and registration
- Supports both personal and business accounts

### QR Generation (`useQR` hook)
- Creates HOYN! formatted QR codes
- Handles customization and downloads
- Integrates with Firebase for user data

### QR Scanner (`QRScannerWrapper`)
- Camera-based QR code scanning
- Validates HOYN! format codes
- Handles permissions and torch control

## 🔒 Security Features

- **Firebase Security Rules** for data access control
- **Input validation** and sanitization
- **Rate limiting** via middleware
- **CSRF protection** and security headers
- **Environment variable** protection

## 🎨 Design System

### Colors
- **Primary**: Purple/Pink gradient (#E040FB)
- **Background**: Black (#000000)
- **Accent**: Cyan highlights
- **Text**: White with gray variants

### Typography
- **Headings**: Orbitron font family
- **Body**: System fonts for readability
- **Code**: Monospace fonts

### Components
- **NeonButton**: Glowing cyberpunk buttons
- **AnimatedCard**: Smooth transition cards
- **Loading**: Futuristic loading indicators

## 📈 Performance

- **Server-Side Rendering** with Next.js
- **Static Site Generation** for optimal loading
- **Image optimization** with next/image
- **Code splitting** and lazy loading
- **CDN delivery** via Vercel

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase** for backend services
- **Vercel** for hosting platform
- **Hugging Face** for AI capabilities
- **Next.js** team for the framework
- **Tailwind CSS** for styling system

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Visit our website: https://hoyn-1.vercel.app
- Check documentation in `/docs`

---

Made with ❤️ and lots of ☕ by the HOYN! team

🎆 **Experience the future of digital identity!** 🎆