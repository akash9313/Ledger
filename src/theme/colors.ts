export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSelected: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  icon: string;
  accent: string;
  dropdownBg: string;
  inputBg: string;
  modalBg: string;
  positive: string;
  positiveBg: string;
  negative: string;
  negativeBg: string;
  badgeBg: string;
  statusBar: 'light-content' | 'dark-content';
}

export const darkColors: ThemeColors = {
  background: '#0B0E14',
  surface: '#151923',
  surfaceSelected: '#232A3B',
  card: '#151923',
  cardBorder: '#232A3B',
  textPrimary: '#F9FAFB',
  textSecondary: '#E5E7EB',
  textMuted: '#9CA3AF',
  border: '#232A3B',
  icon: '#F9FAFB',
  accent: '#6366F1',
  dropdownBg: '#1E2330',
  inputBg: '#151923',
  modalBg: '#1E2330',
  positive: '#34D399',
  positiveBg: 'rgba(52, 211, 153, 0.15)',
  negative: '#F87171',
  negativeBg: 'rgba(248, 113, 113, 0.15)',
  badgeBg: '#1F2937',
  statusBar: 'light-content',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSelected: '#EEF2FF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  border: '#E2E8F0',
  icon: '#0F172A',
  accent: '#4F46E5',
  dropdownBg: '#FFFFFF',
  inputBg: '#F1F5F9',
  modalBg: '#FFFFFF',
  positive: '#059669',
  positiveBg: '#ECFDF5',
  negative: '#D97706',
  negativeBg: '#FEF2F2',
  badgeBg: '#F1F5F9',
  statusBar: 'dark-content',
};

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'light' ? lightColors : darkColors;
};
