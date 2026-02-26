import React from 'react';

export const VideoBackground = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black">
        {/* Animated gradient overlay for dynamic feel */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1),transparent_50%)] animate-pulse" />
        </div>
        
        {/* Simulated video effect with animated patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-primary/20 to-transparent animate-[slide_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-t from-chart-2/20 to-transparent animate-[slide_10s_ease-in-out_infinite_reverse]" />
        </div>
        
        {/* Grid pattern for tech feel */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(249,115,22,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />
    </div>
  );
};
