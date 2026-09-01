import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export type IconName = 
  | 'arrow-back'
  | 'search'
  | 'settings'
  | 'call'
  | 'pencil'
  | 'card'
  | 'send'
  | 'whatsapp'
  | 'sms'
  | 'trash'
  | 'add'
  | 'cloud'
  | 'moon'
  | 'sun'
  | 'user'
  | 'check'
  | 'info'
  | 'chevron-forward'
  | 'close'
  | 'journal';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 22, color = '#FFFFFF' }) => {
  switch (name) {
    case 'arrow-back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19 12H5M12 19l-7-7 7-7" />
        </Svg>
      );

    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="11" cy="11" r="8" />
          <Path d="M21 21l-4.35-4.35" />
        </Svg>
      );

    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </Svg>
      );

    case 'call':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
        </Svg>
      );

    case 'pencil':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </Svg>
      );

    case 'card':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <Path d="M1 10h22" />
        </Svg>
      );

    case 'send':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </Svg>
      );

    case 'whatsapp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <Path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.758.459 3.474 1.33 4.988L2 22l5.181-1.338a9.96 9.96 0 004.831 1.238h.005c5.506 0 9.989-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.925 9.925 0 0012.012 2zm5.787 14.184c-.244.688-1.428 1.313-1.974 1.368-.521.053-1.202.083-3.447-.847-2.872-1.189-4.717-4.113-4.86-4.304-.143-.191-1.162-1.547-1.162-2.949 0-1.402.734-2.091.995-2.378.261-.287.568-.359.757-.359.189 0 .378.002.544.01.176.009.412-.067.644.49.244.584.833 2.032.906 2.18.073.148.121.32.024.512-.097.191-.146.31-.29.477-.143.167-.301.373-.43.501-.143.143-.292.298-.126.584.167.286.74 1.22 1.587 1.975 1.091.973 2.011 1.274 2.298 1.417.286.143.454.12.622-.072.167-.191.716-.834.906-1.12.191-.286.381-.238.644-.143.262.095 1.666.786 1.952.929.286.143.477.215.548.334.072.119.072.689-.172 1.377z" />
        </Svg>
      );

    case 'sms':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </Svg>
      );

    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </Svg>
      );

    case 'add':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );

    case 'cloud':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
        </Svg>
      );

    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </Svg>
      );

    case 'sun':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="5" />
          <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </Svg>
      );

    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );

    case 'chevron-forward':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 18l6-6-6-6" />
        </Svg>
      );

    case 'journal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </Svg>
      );

    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 6L6 18M6 6l12 12" />
        </Svg>
      );

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <Circle cx="12" cy="12" r="10" />
        </Svg>
      );
  }
};
