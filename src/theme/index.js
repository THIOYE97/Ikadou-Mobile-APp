// src/theme/index.js
// ─── Ikadou Design System ───────────────────────────────────────────

export const Colors = {
  // Brand
  teal:       '#00A8B5',
  tealDark:   '#007D87',
  tealLight:  '#E0F7FA',
  tealAlpha:  'rgba(0,168,181,0.12)',
  orange:     '#FF5722',
  orangeLight:'#FF7043',
  orangeAlpha:'rgba(255,87,34,0.10)',

  // Backgrounds
  dark:       '#0B1A1C',
  dark2:      '#122226',
  card:       '#152E33',
  mid:        '#1E3A40',
  border:     'rgba(0,168,181,0.15)',
  borderFaint:'rgba(0,168,181,0.08)',

  // Text
  textPrimary:'#E8F4F5',
  textMuted:  '#7BA8AE',
  white:      '#FFFFFF',

  // Status
  success:    '#22C55E',
  error:      '#EF4444',
  warning:    '#F59E0B',
};

export const Typography = {
  // Font families (loaded via expo-font or system fallback)
  heading: 'System',   // swap to 'Syne' once loaded
  body:    'System',   // swap to 'DMSans' once loaded

  // Sizes
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 17,
  body1: 15,
  body2: 13,
  caption: 11,
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
};

export default { Colors, Typography, Spacing, Radius, Shadow };
