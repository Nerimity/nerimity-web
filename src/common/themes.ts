import { StorageKeys, useLocalStorage, setStorageString } from "./localStorage";

export const DefaultTheme = {
  // Main
  "background-color": "hsl(216deg 9% 8%)",
  "pane-color": "hsl(216deg 8% 15%)",
  "side-pane-color": "hsl(216deg 7.82% 12.55%)",
  "header-background-color": "hsla(216deg 8% 15% / 80%)",
  "header-background-color-blur-disabled": "hsl(216deg 8% 15%)",
  "tooltip-background-color": "rgb(40, 40, 40)",

  "chat-input-background-color": "rgba(0, 0, 0, 0.86)",
  "chat-input-background-color-blur-disabled": "black",

  "chat-markup-bar-background-color": "rgba(0, 0, 0, 0.86)",
  "chat-markup-bar-background-color-blur-disabled": "black",

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
  "status-offline": "#adadad",
  "status-online": "#78e380",
  "status-looking-to-play": "#78a5e3",
  "status-away-from-keyboard": "#e3a878",
  "status-do-not-disturb": "#e37878",
  // Text Color
  "text-color": "white",

  // Markup
  "markup-code-background-color": "rgba(0, 0, 0, 0.6)",
  "markup-mention-background-color": "rgba(0, 0, 0, 0.2)",
  "markup-mention-background-color-hover": "rgba(0, 0, 0, 0.6)",
  "markup-codeblock-background-color": "rgba(0, 0, 0, 0.6)",

  "markup-spoiler-background-color": "#0e0f10",
  "markup-spoiler-background-color-hover": "#1c1e20",

  // TODO:
  // Add multiple text colors, rather than using one.. E.G: message-text-color, channel-text-color, etc.
};

type ThemeKey = keyof typeof DefaultTheme;

const [customColors, setCustomColors] = useLocalStorage<
  Partial<Record<ThemeKey, string>>
>(StorageKeys.CUSTOM_COLORS, {});

const currentTheme = () => ({ ...DefaultTheme, ...customColors() });

export const updateTheme = () => {
  const newTheme = currentTheme();
  for (const key in newTheme) {
    document.documentElement.style.setProperty(
      `--${key}`,
      newTheme[key as ThemeKey]
    );
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
    colors: DefaultTheme,
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
      "markup-code-background-color": "rgba(255, 255, 255, 0.12)",
      "markup-mention-background-color": "rgba(255, 255, 255, 0.1)",
      "markup-mention-background-color-hover": "rgba(255, 255, 255, 0.12)",
      "markup-codeblock-background-color": "rgba(255, 255, 255, 0.1)",

      "markup-spoiler-background-color": "#1d1f20ff",
      "markup-spoiler-background-color-hover": "#2b2e30ff",
    },
    maintainers: ["Asraye"],
  },
};

// Apply a preset
export const applyTheme = (name: string) => {
  const preset = themePresets[name];
  if (!preset) return;

  // Clear previous
  Object.keys(customColors()).forEach((key) =>
    setThemeColor(key as ThemeKey, undefined)
  );
  // Apply preset
  Object.entries(preset.colors).forEach(([key, value]) =>
    setThemeColor(key as ThemeKey, value)
  );
  // Persist
  setStorageString(StorageKeys.CUSTOM_COLORS, JSON.stringify(preset.colors));
};

updateTheme();

export { DefaultTheme as theme, currentTheme, customColors };
