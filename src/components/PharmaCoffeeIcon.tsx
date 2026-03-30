
import React from 'react';

interface PharmaCoffeeIconProps {
    isLightMode?: boolean;
}

export const PharmaCoffeeIcon: React.FC<PharmaCoffeeIconProps> = ({ isLightMode = false }) => {
  // If the background is light, we need dark strokes for visibility
  const strokeColor = isLightMode ? "#1a1a1a" : "white";
  const strokeOpacity = isLightMode ? "0.8" : "0.7";

  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        <defs>
        {/* Liquid Gradient: Dark Body */}
        <linearGradient id="coffeeDark" x1="12" y1="20" x2="12" y2="10">
            <stop offset="0%" stopColor="#24140E" /> 
            <stop offset="100%" stopColor="#3E2723" />
        </linearGradient>

        {/* Crema Gradient: Golden/Tiger Skin */}
        <linearGradient id="cremaGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4A373" />
            <stop offset="50%" stopColor="#F59E0B" /> 
            <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Glass Reflection - Adjusted for Light Mode */}
        <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isLightMode ? "#000" : "white"} stopOpacity={isLightMode ? "0.05" : "0.4"} />
            <stop offset="40%" stopColor={isLightMode ? "#000" : "white"} stopOpacity="0" />
            <stop offset="60%" stopColor={isLightMode ? "#000" : "white"} stopOpacity="0" />
            <stop offset="100%" stopColor={isLightMode ? "#000" : "white"} stopOpacity={isLightMode ? "0.05" : "0.2"} />
        </linearGradient>
        </defs>

        {/* HANDLE (Glass Loop) */}
        <path 
            d="M18.5 10 C20.5 10 21.5 11 21.5 12.5 C21.5 14.5 19.5 15.5 17.5 15.5" 
            stroke={strokeColor} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeOpacity={isLightMode ? "0.6" : "0.8"}
        />

        {/* GLASS BODY (Outer Shape) - No Saucer */}
        <path 
            d="M6 8 L7 18 C7.2 19.5 8.5 20.5 10 20.5 H14 C15.5 20.5 16.8 19.5 17 18 L18 8" 
            stroke={strokeColor} 
            strokeWidth="1.2" 
            strokeOpacity={strokeOpacity}
            fill="url(#glassShine)"
        />

        {/* LIQUID BODY (Black Coffee) - Bottom 2/3 */}
        <path 
            d="M7.2 17.5 L6.5 11 H17.5 L16.8 17.5 C16.7 18.5 15.5 19.5 14 19.5 H10 C8.5 19.5 7.3 18.5 7.2 17.5 Z" 
            fill="url(#coffeeDark)"
        />

        {/* CREMA LAYER (Side View + Top Surface) */}
        {/* This is the golden band visible through the glass */}
        <path 
            d="M6.3 9 L6.5 11 H17.5 L17.7 9" 
            fill="#D4A373" 
            opacity="0.9"
        />
        {/* The top surface ellipse */}
        <ellipse cx="12" cy="9" rx="5.7" ry="1.5" fill="url(#cremaGold)" stroke="#92400E" strokeWidth="0.5" />

        {/* CREMA HIGHLIGHT (Tiger Stripe) */}
        <path d="M10 9 Q12 9.8 14 9" stroke="#78350F" strokeWidth="0.5" opacity="0.5" strokeLinecap="round" />

    </svg>
  );
};
