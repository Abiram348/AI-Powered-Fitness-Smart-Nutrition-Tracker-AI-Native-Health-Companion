// FitTrack AI - Professional Dark Theme
export const Colors = {
  // Primary palette
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42DB',
  
  // Accent colors
  accent: '#00D9FF',
  accentGreen: '#00E676',
  accentOrange: '#FF9100',
  accentRed: '#FF5252',
  accentPink: '#FF4081',
  
  // Background hierarchy
  background: '#0A0A0F',
  surface: '#13131A',
  surfaceLight: '#1C1C26',
  surfaceElevated: '#252530',
  
  // Text hierarchy
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textTertiary: '#606070',
  textMuted: '#404050',
  
  // Borders
  border: '#2A2A36',
  borderLight: '#3A3A46',
  
  // Status colors
  success: '#00E676',
  warning: '#FFB300',
  error: '#FF5252',
  info: '#448AFF',
  
  // Gradient pairs
  gradients: {
    primary: ['#6C63FF', '#4A42DB'],
    accent: ['#00D9FF', '#0084FF'],
    success: ['#00E676', '#00C853'],
    orange: ['#FF9100', '#FF6D00'],
    pink: ['#FF4081', '#F50057'],
    dark: ['#1C1C26', '#0A0A0F'],
    card: ['rgba(28,28,38,0.8)', 'rgba(19,19,26,0.9)'],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};
