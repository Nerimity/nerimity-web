import { StorageKeys, useReactiveLocalStorage } from "./localStorage";

export const theme = {
  "background-color": "hsl(216deg 9% 8%)",
  "header-background-color": "rgba(48, 48, 48, 0.86)",
  "header-background-color-blur-disabled": "rgb(48, 48, 48)",
  "tooltip-background-color": "rgb(40, 40, 40)",
  "primary-color": "#4c93ff",
  "alert-color": "#eb6e6e",
  "warn-color": "#e8a859",
  "success-color": "#78e380",
  "pane-color": "hsl(216deg 8% 15%)",
  "success-color-dark": "#1c221d",
  "primary-color-dark": "#2d3746",
  "alert-color-dark": "#3e2626",
  "warn-color-dark": "#3a3229",
};

type ThemeKey = keyof typeof theme;

const [customColors, setCustomColors] = useReactiveLocalStorage<
  Partial<Record<ThemeKey, string>>
>(StorageKeys.CUSTOM_COLORS, {});

const currentTheme = () => ({ ...theme, ...customColors() });

export const updateTheme = () => {
  const newTheme = currentTheme();

  for (const key in newTheme) {
    document.documentElement.style.setProperty(
      `--${key}`,
      newTheme[key as ThemeKey]
    );
  }
};

export const setThemeColor = (key: string, value?: string) => {
  if (value === undefined) {
    const temp = { ...customColors() };
    delete temp[key];
    setCustomColors(temp);
  } else {
    setCustomColors({ ...customColors(), [key]: value });
  }
  updateTheme();
};

export { currentTheme, customColors };
