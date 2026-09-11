import { Platform } from 'react-native';

// Single source of truth for colors, type scale, and spacing.
export const colors = {
  ink: '#20243D',
  subink: '#5B6078',
  mutedink: '#666B80',
  indigoink: '#6354BB',
  mint: '#087F73',
  mintTint: '#DDF6EB',
  mintInk: '#115E59',
  lavender: '#6250AD',
  lavenderTint: '#EDE8FC',
  amberTint: '#FFF3DD',
  amberInk: '#A66A1F',
  neutralTint: '#F0EFEC',
  neutralInk: '#6B6B66',
  frame: 'rgba(255, 255, 255, 0.7)',
};

export const gradients = {
  appBackground: ['#E7E2FA', '#E4F3F4', '#F9EDE9', '#EEE8FA'] as const,
  appBackgroundLocations: [0, 0.35, 0.7, 1] as const,
  coral: ['#DA5752', '#B93836'] as const,
  coralLocations: [0, 1] as const,
};

export const shadows = {
  phone: {
    shadowColor: '#5B6EE8',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.35,
    shadowRadius: 70,
    elevation: 20,
  },
  soft: {
    shadowColor: '#22232A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 2,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  input: 16,
  card: 24,
  tabBar: 28,
  phoneFrame: 38,
  pill: 999,
};

export const typography = {
  h1: { fontFamily: 'Inter_600SemiBold', fontSize: 32, letterSpacing: -1.1 },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 20, letterSpacing: -0.2 },
  h3: { fontFamily: 'Inter_500Medium', fontSize: 17 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 25 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 21 },
};

// Translucent surfaces retain readable contrast over the ambient background.
export const glassSurface = {
  ...Platform.select({ web: { backdropFilter: 'blur(22px) saturate(135%)' } }),
  backgroundColor: 'rgba(255,255,255,0.56)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.88)',
  overflow: 'hidden' as const,
};
