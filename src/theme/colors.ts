export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSelected: string;
  card: string;
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
  negative: string;
  statusBar: 'light-content' | 'dark-content';
}

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceSelected: '#374151',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#E5E7EB',
  textMuted: '#9CA3AF',
  border: '#374151',
  icon: '#E5E7EB',
  accent: '#3B82F6',
  dropdownBg: '#2D2D2D',
  inputBg: '#1E1E1E',
  modalBg: '#2D2D2D',
  positive: '#4ADE80',
  negative: '#F87171',
  statusBar: 'light-content',
};

export const lightColors: ThemeColors = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceSelected: '#E5E7EB',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  icon: '#111827',
  accent: '#2563EB',
  dropdownBg: '#FFFFFF',
  inputBg: '#F9FAFB',
  modalBg: '#FFFFFF',
  positive: '#16A34A',
  negative: '#DC2626',
  statusBar: 'dark-content',
};

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'light' ? lightColors : darkColors;
};
