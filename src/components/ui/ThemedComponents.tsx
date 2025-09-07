// src/components/ui/ThemedComponents.tsx
'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  glow?: boolean;
}

export function ThemedCard({ children, className = '', variant = 'default', glow = false }: ThemedCardProps) {
  const { customization, getThemeClasses } = useTheme();
  
  if (!customization) {
    return <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 ${className}`}>{children}</div>;
  }

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: customization.primaryColor + '20',
          borderColor: customization.primaryColor,
          color: customization.textColor
        };
      case 'secondary':
        return {
          backgroundColor: customization.secondaryColor + '20',
          borderColor: customization.secondaryColor,
          color: customization.textColor
        };
      case 'accent':
        return {
          backgroundColor: customization.accentColor + '20',
          borderColor: customization.accentColor,
          color: customization.textColor
        };
      default:
        return {
          backgroundColor: customization.backgroundColor,
          borderColor: customization.primaryColor + '50',
          color: customization.textColor
        };
    }
  };

  const glowClass = glow && customization.theme === 'cyberpunk' ? 'glow-subtle' : '';

  return (
    <div 
      className={`p-6 border-2 ${getThemeClasses()} ${glowClass} ${className}`}
      style={getVariantStyles()}
    >
      {children}
    </div>
  );
}

interface ThemedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  glow?: boolean;
}

export function ThemedButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  glow = false
}: ThemedButtonProps) {
  const { customization } = useTheme();
  
  if (!customization) {
    return (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors ${className}`}
      >
        {children}
      </button>
    );
  }

  const getButtonStyles = (): React.CSSProperties => {
    const baseStyle = {
      transition: 'all 0.3s ease',
      borderWidth: '2px',
      borderStyle: 'solid'
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: customization.primaryColor,
          borderColor: customization.primaryColor,
          color: customization.backgroundColor
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: customization.secondaryColor,
          borderColor: customization.secondaryColor,
          color: customization.backgroundColor
        };
      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: customization.accentColor,
          borderColor: customization.accentColor,
          color: customization.backgroundColor
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: customization.primaryColor,
          color: customization.primaryColor
        };
      default:
        return baseStyle;
    }
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const getBorderStyle = (): string => {
    switch (customization.borderStyle) {
      case 'sharp':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-xl';
      case 'cyber':
        return 'rounded-lg cyber-border-btn';
      case 'minimal':
        return 'rounded-sm';
      default:
        return 'rounded-lg';
    }
  };

  const glowClass = glow && customization.theme === 'cyberpunk' ? 'glow-subtle' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getSizeClasses()} ${getBorderStyle()} ${glowClass} ${className} font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
      style={getButtonStyles()}
    >
      {children}
    </button>
  );
}

interface ThemedTextProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'muted';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  className?: string;
  glow?: boolean;
}

export function ThemedText({ 
  children, 
  variant = 'default', 
  size = 'base',
  weight = 'normal',
  className = '',
  glow = false
}: ThemedTextProps) {
  const { customization } = useTheme();
  
  if (!customization) {
    return <span className={`text-white ${className}`}>{children}</span>;
  }

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return customization.primaryColor;
      case 'secondary':
        return customization.secondaryColor;
      case 'accent':
        return customization.accentColor;
      case 'muted':
        return customization.textColor + '80';
      default:
        return customization.textColor;
    }
  };

  const getSizeClass = (): string => {
    switch (size) {
      case 'xs':
        return 'text-xs';
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      case '2xl':
        return 'text-2xl';
      case '3xl':
        return 'text-3xl';
      case '4xl':
        return 'text-4xl';
      default:
        return 'text-base';
    }
  };

  const getWeightClass = (): string => {
    switch (weight) {
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      case 'black':
        return 'font-black';
      default:
        return 'font-normal';
    }
  };

  const glowClass = glow && customization.theme === 'cyberpunk' ? 'glow-text' : '';

  return (
    <span 
      className={`${getSizeClass()} ${getWeightClass()} ${glowClass} ${className}`}
      style={{ 
        color: getTextColor(),
        fontFamily: customization.fontFamily === 'orbitron' ? 'Orbitron' : customization.fontFamily
      }}
    >
      {children}
    </span>
  );
}

interface ThemedBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ThemedBadge({ children, variant = 'primary', size = 'md', className = '' }: ThemedBadgeProps) {
  const { customization } = useTheme();
  
  if (!customization) {
    return <span className={`bg-purple-600 text-white px-2 py-1 rounded-full text-xs ${className}`}>{children}</span>;
  }

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: customization.primaryColor,
          color: customization.backgroundColor
        };
      case 'secondary':
        return {
          backgroundColor: customization.secondaryColor,
          color: customization.backgroundColor
        };
      case 'accent':
        return {
          backgroundColor: customization.accentColor,
          color: customization.backgroundColor
        };
      case 'success':
        return {
          backgroundColor: '#10B981',
          color: '#FFFFFF'
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          color: '#FFFFFF'
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          color: '#FFFFFF'
        };
      default:
        return {
          backgroundColor: customization.primaryColor,
          color: customization.backgroundColor
        };
    }
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1 text-xs';
    }
  };

  const getBorderStyle = (): string => {
    switch (customization.borderStyle) {
      case 'sharp':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-full';
      case 'cyber':
        return 'rounded-md';
      case 'minimal':
        return 'rounded-sm';
      default:
        return 'rounded-full';
    }
  };

  return (
    <span 
      className={`${getSizeClasses()} ${getBorderStyle()} font-medium ${className}`}
      style={getVariantStyles()}
    >
      {children}
    </span>
  );
}