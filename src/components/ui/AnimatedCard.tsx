// src/components/ui/AnimatedCard.tsx
'use client';

import { ReactNode, useState } from 'react';
import { useScrollAnimation, useMagneticEffect } from '@/hooks/useScrollAnimation';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  magnetic?: boolean;
  hover3d?: boolean;
  onClick?: () => void;
}

export default function AnimatedCard({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  magnetic = false,
  hover3d = true,
  onClick
}: AnimatedCardProps) {
  const { isVisible, elementRef: scrollRef } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true
  });
  
  const magneticRef = useMagneticEffect(0.1);
  const [isHovered, setIsHovered] = useState(false);

  // Animation classes based on direction
  const getAnimationClasses = () => {
    const base = `transition-all duration-700 ease-out`;
    
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `${base} opacity-0 translate-y-12`;
        case 'down':
          return `${base} opacity-0 -translate-y-12`;
        case 'left':
          return `${base} opacity-0 translate-x-12`;
        case 'right':
          return `${base} opacity-0 -translate-x-12`;
        case 'scale':
          return `${base} opacity-0 scale-90`;
        default:
          return `${base} opacity-0 translate-y-12`;
      }
    }
    
    return `${base} opacity-100 translate-x-0 translate-y-0 scale-100`;
  };

  // 3D hover effect
  const get3DStyle = (): React.CSSProperties => {
    if (!hover3d || !isHovered) return {};
    return {
      transformStyle: 'preserve-3d',
      transform: 'perspective(1000px) rotateX(5deg) rotateY(5deg) scale(1.02)'
    };
  };

  const combinedRef = (element: HTMLDivElement | null) => {
    if (element) {
      // @ts-ignore
      scrollRef.current = element;
      if (magnetic) {
        // @ts-ignore
        magneticRef.current = element;
      }
    }
  };

  return (
    <div
      ref={combinedRef}
      className={`
        ${getAnimationClasses()}
        ${hover3d ? 'hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25' : ''}
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        ...get3DStyle()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}