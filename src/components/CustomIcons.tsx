
import React from 'react';

interface IconProps {
    className?: string;
}

export const EspressoMachineIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Drip Tray */}
        <path d="M4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V18H4V19Z" opacity="0.4" />
        {/* Main Body */}
        <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.89543 2 4 2.89543 4 4V16H20V4C20 2.89543 19.1046 2 18 2H6ZM16 5C16.5523 5 17 5.44772 17 6C17 6.55228 16.5523 7 16 7C15.4477 7 15 6.55228 15 6C15 5.44772 15.4477 5 16 5ZM8 5C8.55228 5 9 5.44772 9 6C9 6.55228 8.55228 7 8 7C7.44772 7 7 6.55228 7 6C7 5.44772 7.44772 5 8 5ZM12 5C13.6569 5 15 6.34315 15 8V9H16.5C16.7761 9 17 9.22386 17 9.5C17 9.77614 16.7761 10 16.5 10H15.8293C15.4175 11.1652 14.3062 12 13 12H11C9.69378 12 8.58254 11.1652 8.17071 10H7.5C7.22386 10 7 9.77614 7 9.5C7 9.22386 7.22386 9 7.5 9H9V8C9 6.34315 10.3431 5 12 5Z" />
    </svg>
);

export const TamperIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Lelit Style Wood Handle (Bulbous) */}
        <path d="M12 2C9.5 2 7.5 3.5 7.5 6C7.5 7.5 8.5 9.5 10 10.5V13H14V10.5C15.5 9.5 16.5 7.5 16.5 6C16.5 3.5 14.5 2 12 2Z" />
        
        {/* Metal Base (Thick & Flat) */}
        <path d="M8 14H16C16.5523 14 17 14.4477 17 15V19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19V15C7 14.4477 7.44772 14 8 14Z" opacity="0.9" />
        
        {/* Shine on base */}
        <path d="M8.5 16H15.5" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" />
    </svg>
);

export const GrinderIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Hopper */}
        <path d="M7 2L8 8H16L17 2H7Z" opacity="0.6" />
        {/* Main Body */}
        <path d="M8 8H16V16C16 17.1046 15.1046 18 14 18H10C8.89543 18 8 17.1046 8 16V8Z" />
        {/* Base */}
        <path d="M6 18H18V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V18Z" opacity="0.8" />
        {/* Spout */}
        <path d="M12 14L10 16H14L12 14Z" fill="white" fillOpacity="0.5" />
    </svg>
);

export const AccessoriesIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Scale Platform */}
        <rect x="4" y="8" width="16" height="2" rx="1" opacity="0.8" />
        {/* Scale Body */}
        <rect x="5" y="10" width="14" height="10" rx="2" />
        {/* Display */}
        <rect x="8" y="13" width="8" height="4" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
);

export const CoffeeBeansIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Single Stylized Bean Shape */}
        <path d="M12 3C8.5 3 5 6 5 11C5 15 7.5 19 11 20.5C14.5 22 18 19 19 15C20 11 18 6 15 4C14 3.33 13 3 12 3Z" />
        
        {/* S-Curve Center Cut (The characteristic coffee bean split) */}
        <path d="M11 6C11 6 13 8 13 11C13 14 10 15 10 18" stroke="var(--md-sys-color-surface-container)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        
        {/* Highlight */}
        <path d="M14 6.5C15.5 8 16.5 10 16.5 12" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export const MilkCartonIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Carton Body */}
        <path d="M7 8.5L9 4H15L17 8.5V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V8.5Z" />
        {/* Top Seal / Detail */}
        <path d="M9 4L10 2H14L15 4H9Z" opacity="0.6" />
        {/* Drop (Negative space or overlay) */}
        <path d="M12 17C13.1046 17 14 16.1046 14 15C14 13.8954 12 11.5 12 11.5C12 11.5 10 13.8954 10 15C10 16.1046 10.8954 17 12 17Z" fill="var(--md-sys-color-surface-container)" />
    </svg>
);

export const WaterDropIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22Z" />
        <path d="M10 10C10 10 11 9 13 11" stroke="var(--md-sys-color-surface-container)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
);
