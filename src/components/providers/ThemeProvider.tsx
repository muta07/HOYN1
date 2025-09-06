// src/components/providers/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, BusinessProfile } from '@/lib/firebase';

// Update the type to accept both profile types
type ProfileType = UserProfile | BusinessProfile;

export interface ProfileCustomization {
  theme: 'cyberpunk' | 'neon' | 'minimal' | 'dark' | 'colorful' | 'retro';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: 'orbitron' | 'roboto' | 'inter' | 'poppins' | 'jetbrains';
  borderStyle: 'sharp' | 'rounded' | 'cyber' | 'minimal';
  animationStyle: 'static' | 'smooth' | 'dynamic';
  customCSS: string;
  useGradient: boolean;
  gradientDirection: 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl' | 'to-t' | 'to-tr';
  profileLayout: 'standard' | 'compact' | 'detailed';
  showCustomization: boolean;
}

interface ThemeContextType {
  customization: ProfileCustomization | null;
  setCustomization: (customization: ProfileCustomization | null) => void;
  getThemeStyles: () => React.CSSProperties;
  getThemeClasses: () => string;
  applyProfileTheme: (profile: ProfileType) => void;
  resetToDefault: () => void;
}

const defaultCustomization: ProfileCustomization = {
  theme: 'cyberpunk',
  primaryColor: '#E040FB',
  secondaryColor: '#651FFF',
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  accentColor: '#00BCD4',
  fontFamily: 'orbitron',
  borderStyle: 'cyber',
  animationStyle: 'dynamic',
  customCSS: '',
  useGradient: true,
  gradientDirection: 'to-br',
  profileLayout: 'standard',
  showCustomization: true
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [customization, setCustomization] = useState<ProfileCustomization | null>(null);

  const getThemeStyles = (): React.CSSProperties => {
    if (!customization) return {};

    const styles: React.CSSProperties & { [key: string]: any } = {
      '--primary-color': customization.primaryColor,
      '--secondary-color': customization.secondaryColor,
      '--background-color': customization.backgroundColor,
      '--text-color': customization.textColor,
      '--accent-color': customization.accentColor,
      backgroundColor: customization.backgroundColor,
      color: customization.textColor,
      fontFamily: getFontFamily(customization.fontFamily)
    };

    // Add gradient support
    if (customization.useGradient) {
      styles.background = `linear-gradient(${customization.gradientDirection}, ${customization.backgroundColor}, ${customization.secondaryColor}20)`;
    }

    return styles;
  };

  const getThemeClasses = (): string => {
    if (!customization) return '';

    const classes = [];

    // Border style classes
    switch (customization.borderStyle) {
      case 'sharp':
        classes.push('rounded-none border-2');
        break;
      case 'rounded':
        classes.push('rounded-xl border-2');
        break;
      case 'cyber':
        classes.push('cyber-border rounded-lg');
        break;
      case 'minimal':
        classes.push('border border-gray-300 rounded-sm');
        break;
    }

    // Animation classes
    switch (customization.animationStyle) {
      case 'dynamic':
        classes.push('transition-all duration-300 hover:scale-105');
        break;
      case 'smooth':
        classes.push('transition-all duration-500');
        break;
      case 'static':
        // No animation classes
        break;
    }

    // Theme-specific classes
    switch (customization.theme) {
      case 'cyberpunk':
        classes.push('glow-subtle');
        break;
      case 'neon':
        classes.push('neon-glow');
        break;
      case 'minimal':
        classes.push('shadow-lg');
        break;
    }

    return classes.join(' ');
  };

  const getFontFamily = (fontFamily: string): string => {
    switch (fontFamily) {
      case 'orbitron':
        return '"Orbitron", monospace';
      case 'roboto':
        return '"Roboto", sans-serif';
      case 'inter':
        return '"Inter", sans-serif';
      case 'poppins':
        return '"Poppins", sans-serif';
      case 'jetbrains':
        return '"JetBrains Mono", monospace';
      default:
        return '"Orbitron", monospace';
    }
  };

  // Update this function to handle both profile types
  const applyProfileTheme = (profile: ProfileType) => {
    // Check if it's a UserProfile with profileCustomization
    if ('profileCustomization' in profile && profile.profileCustomization && profile.profileCustomization.showCustomization) {
      setCustomization(profile.profileCustomization as ProfileCustomization);
    } else {
      setCustomization(defaultCustomization);
    }
  };

  const resetToDefault = () => {
    setCustomization(defaultCustomization);
  };

  // Apply custom CSS if provided
  useEffect(() => {
    if (customization && customization.customCSS) {
      const styleElement = document.createElement('style');
      styleElement.id = 'hoyn-custom-theme';
      styleElement.textContent = customization.customCSS;
      
      // Remove existing custom styles
      const existingStyle = document.getElementById('hoyn-custom-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(styleElement);
      
      return () => {
        const element = document.getElementById('hoyn-custom-theme');
        if (element) {
          element.remove();
        }
      };
    }
  }, [customization?.customCSS]);

  const value: ThemeContextType = {
    customization,
    setCustomization,
    getThemeStyles,
    getThemeClasses,
    applyProfileTheme,
    resetToDefault
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Themed wrapper component for profile pages - updated to accept both profile types
export function ThemedProfileWrapper({ 
  children, 
  profile 
}: { 
  children: React.ReactNode; 
  profile?: ProfileType | null;
}) {
  const { customization, applyProfileTheme, getThemeStyles, getThemeClasses } = useTheme();

  useEffect(() => {
    if (profile) {
      applyProfileTheme(profile);
    }
  }, [profile, applyProfileTheme]);

  if (!customization) {
    return <>{children}</>;
  }

  return (
    <div 
      className={`themed-profile-container ${getThemeClasses()}`}
      style={getThemeStyles()}
    >
      {children}
    </div>
  );
}