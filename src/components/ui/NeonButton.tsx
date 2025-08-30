// src/components/ui/NeonButton.tsx
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { useRippleEffect } from '@/hooks/useScrollAnimation';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  ripple?: boolean;
  className?: string;
}

export default function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  ripple = true,
  className = '',
  onClick,
  ...props
}: NeonButtonProps) {
  const { ripples, createRipple } = useRippleEffect();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      createRipple(e);
    }
    if (onClick) {
      onClick(e);
    }
  };
  const baseClasses = `
    font-orbitron font-bold transition-all duration-300 
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    relative overflow-hidden group
  `;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-purple-600 to-pink-600 
      hover:from-purple-500 hover:to-pink-500
      text-white rounded-lg
      shadow-lg hover:shadow-purple-500/25
      ${glow ? 'glow-intense' : ''}
    `,
    secondary: `
      bg-transparent border-2 border-purple-500 
      text-purple-300 hover:text-white
      hover:bg-purple-500/20 rounded-lg
      hover:border-purple-400
    `,
    outline: `
      bg-transparent cyber-border
      text-purple-300 hover:text-white
      hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20
      rounded-lg
    `
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effects */}
      {ripple && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            pointerEvents: 'none',
            animationDuration: '0.6s'
          }}
        />
      ))}
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                      opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
      
      <span className="relative z-10">{children}</span>
    </button>
  );
}