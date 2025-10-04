import { StorageKeys, useLocalStorage, setStorageString } from "./localStorage";

const theme = {
  // Main
  "background-color": "hsl(216deg 9% 8%)",
  "pane-color": "hsl(216deg 8% 15%)",
  "side-pane-color": "hsl(216deg 7.82% 12.55%)",
  "header-background-color": "hsla(216deg 8% 15% / 80%)",
  "header-background-color-blur-disabled": "hsl(216deg 8% 15%)",
  "tooltip-background-color": "rgb(40, 40, 40)",
  // Primary
  "primary-color": "#4c93ff",
  "primary-color-dark": "#2d3746",
  // Alerts
  "alert-color": "#eb6e6e",
  "alert-color-dark": "#3e2626",
  // Warns
  "warn-color": "#ff8f2c",
  "warn-color-dark": "#3a3229",
  // Success
  "success-color": "#78e380",
  "success-color-dark": "#1c221d",
  // Status
  "Status-Offline": "#adadad",
  "Status-Online": "#78e380",
  "Status-Looking-To-Play": "#78a5e3",
  "Status-Away-From-Keyboard": "#e3a878",
  "Status-Do-Not-Disturb": "#e37878",
  // Text Color
  "text-color": "white",
  // TODO:
  // Add multiple text colors, rather than using one.. E.G: message-text-color, channel-text-color, etc.
};

type ThemeKey = keyof typeof theme;

const [customColors, setCustomColors] = useLocalStorage<Partial<Record<ThemeKey, string>>>(
  StorageKeys.CUSTOM_COLORS,
  {}
);

const currentTheme = () => ({ ...theme, ...customColors() });

export const updateTheme = () => {
  const newTheme = currentTheme();
  for (const key in newTheme) {
    document.documentElement.style.setProperty(`--${key}`, newTheme[key as ThemeKey]);
  }
};

export const setThemeColor = (key: ThemeKey, value?: string) => {
  if (value === undefined) {
    const temp = { ...customColors() };
    delete temp[key];
    setCustomColors(temp);
  } else {
    setCustomColors({ ...customColors(), [key]: value });
  }
  updateTheme();
};

// Theme presets
export type ThemePreset = {
  colors: Partial<Record<ThemeKey, string>>;
  maintainers: string[];
};

export const themePresets: Record<string, ThemePreset> = {
  Default: {
    colors: {},
    maintainers: ["Superkitten", "Asraye"],
  },
  AMOLED: {
    colors: {
      "background-color": "#000000",
      "pane-color": "#000000",
      "side-pane-color": "#0f0f0f",
      "header-background-color": "#111111cc",
      "header-background-color-blur-disabled": "#000000",
      "tooltip-background-color": "#0a0a0a",
      "primary-color": "#3a5a8f",
      "alert-color": "#ff1f1f",
      "warn-color": "#ff8c00",
      "success-color": "#00ff77",
      "success-color-dark": "#00cc44",
      "primary-color-dark": "#2d3746",
      "alert-color-dark": "#ff4c4c",
      "warn-color-dark": "#ffaa33",
      "text-color": "#e0e0e0",
    },
    maintainers: ["Asraye"],
  },
};

// Apply a preset
export const applyTheme = (name: string) => {
  const preset = themePresets[name];
  if (!preset) return;

  // Clear previous
  Object.keys(customColors()).forEach((key) => setThemeColor(key as ThemeKey, undefined));
  // Apply preset
  Object.entries(preset.colors).forEach(([key, value]) => setThemeColor(key as ThemeKey, value));
  // Persist
  setStorageString(StorageKeys.CUSTOM_COLORS, JSON.stringify(preset.colors));
};

updateTheme();

export { theme, currentTheme, customColors };
