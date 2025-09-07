// Base Profile Interface
export interface BaseProfile {
  uid: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  
  // Social features (Phase 5.3)
  followersCount?: number;
  followingCount?: number;
}

// User Profile Interface
export interface UserProfile extends BaseProfile {
  displayName: string; // Gerçek ad
  bio?: string;
  
  // Social media links
  instagram?: string;
  twitter?: string;
  
  // Settings
  allowAnonymous?: boolean;
  
  // Phase 5.2 - Profile customization
  profileCustomization?: {
    theme?: 'cyberpunk' | 'neon' | 'minimal' | 'dark' | 'colorful' | 'retro';
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: 'orbitron' | 'roboto' | 'inter' | 'poppins' | 'jetbrains';
    borderStyle?: 'sharp' | 'rounded' | 'cyber' | 'minimal';
    animationStyle?: 'none' | 'subtle' | 'dynamic' | 'intense';
    customCSS?: string;
    backgroundImage?: string;
    useGradient?: boolean;
    gradientDirection?: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';
    profileLayout?: 'standard' | 'compact' | 'detailed' | 'creative';
    showCustomization?: boolean;
  };
}

// Business Profile Interface
export interface BusinessProfile extends BaseProfile {
  companyName: string;
  ownerName: string;
  businessType: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  
  // Enhanced Business specific fields
  employees?: string[];
  menuItems?: any[];
  qrCodes?: string[];
  isVerified?: boolean;
  
  // Phase 5.1 - New business fields
  sector?: string;           // İş sektörü
  foundedYear?: number;      // Kuruluş yılı
  employeeCount?: string;    // Çalışan sayısı aralığı
  services?: string[];       // Sunulan hizmetler
  workingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  contactInfo?: {
    whatsapp?: string;
    telegram?: string;
    email2?: string;         // İkinci email
    fax?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    district?: string;
    country?: string;
  };
  businessSettings?: {
    showEmployeeCount?: boolean;
    showFoundedYear?: boolean;
    showWorkingHours?: boolean;
    allowDirectMessages?: boolean;
    showLocation?: boolean;
  };
}