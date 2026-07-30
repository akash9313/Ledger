import { useSettingsStore } from '../features/settings/store/useSettingsStore';
import { getThemeColors, ThemeColors, ThemeMode } from './colors';

export const useTheme = () => {
  const theme = useSettingsStore((state) => state.theme || 'dark');
  const colors: ThemeColors = getThemeColors(theme);
  return { theme, colors, isDark: theme === 'dark' };
};
