// Single source of truth for colors, type scale, and spacing.
export const colors = {
  ink: '#182E35',
  subink: '#52656D',
  mutedink: '#667580',
  indigoink: '#0F766E',
  mint: '#0D9488',
  mintTint: '#CCFBF1',
  mintInk: '#115E59',
  lavender: '#0F766E',
  lavenderTint: '#F0FDFA',
  amberTint: '#FFF3DD',
  amberInk: '#A66A1F',
  neutralTint: '#F0EFEC',
  neutralInk: '#6B6B66',
  frame: 'rgba(255, 255, 255, 0.7)',
};

export const gradients = {
  appBackground: ['#F8FAFC', '#F0FDFA', '#F1F5F9', '#ECFEFF'] as const,
  appBackgroundLocations: [0, 0.35, 0.7, 1] as const,
  coral: ['#F0847E', '#E0605C'] as const,
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
  card: 20,
  tabBar: 24,
  phoneFrame: 38,
  pill: 999,
};

export const typography = {
  h1: { fontFamily: 'Inter_600SemiBold', fontSize: 24, letterSpacing: -0.5 },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 18, letterSpacing: -0.2 },
  h3: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13 },
};
