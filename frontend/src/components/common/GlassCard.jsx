import React from 'react';

export default function GlassCard({ children, style = {}, className = '', onClick }) {
  return (
    <div 
      className={`glass-card ${className}`} 
      style={{ padding: 24, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
