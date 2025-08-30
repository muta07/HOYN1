// src/components/ui/Loading.tsx
'use client';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function Loading({ size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10', 
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Cyberpunk spinner */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-purple-900/30"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent 
                        border-t-purple-500 border-r-pink-500 animate-spin glow-intense"></div>
        <div className="absolute inset-2 rounded-full border border-transparent 
                        border-t-purple-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
      </div>
      
      {text && (
        <p className="text-purple-300 font-orbitron text-sm animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}