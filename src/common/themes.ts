import { StorageKeys, useLocalStorage, setStorageString } from "./localStorage";

export const ThemeCategory = {
  Surface: "Surface",
  Overlays: "Overlays",
  Input: "Input",
  MarkupBar: "Markup Bar",
  Message: "Message",
  Accent: "Accent",
  Alert: "Alert",
  Warn: "Warn",
  Success: "Success",
  Status: "Status",
  Text: "Text",
  Markup: "Markup",
  Drawer: "Drawer",
} as const;

const ThemeTokensBase = [
  // Surface
  {
    key: "background-color",
    category: ThemeCategory.Surface,
    value: "hsl(216deg 9% 8%)",
  },
  {
    key: "pane-color",
    category: ThemeCategory.Surface,
    value: "hsl(216deg 8% 15%)",
  },
  {
    key: "side-pane-color",
    category: ThemeCategory.Surface,
    value: "hsl(216deg 7.82% 12.55%)",
  },

  // Overlays
  {
    key: "header-background-color",
    category: ThemeCategory.Overlays,
    value: "hsla(216deg 8% 15% / 80%)",
  },
  {
    key: "header-background-color-blur-disabled",
    category: ThemeCategory.Overlays,
    value: "hsl(216deg 8% 15%)",
  },
  {
    key: "tooltip-background-color",
    category: ThemeCategory.Overlays,
    value: "rgb(40, 40, 40)",
  },

  // Input
  {
    key: "chat-input-background-color",
    category: ThemeCategory.Input,
    value: "rgba(0, 0, 0, 0.86)",
  },
  {
    key: "chat-input-background-color-blur-disabled",
    category: ThemeCategory.Input,
    value: "black",
  },

  // Markup bar
  {
    key: "chat-markup-bar-background-color",
    category: ThemeCategory.MarkupBar,
    value: "rgba(0, 0, 0, 0.86)",
  },
  {
    key: "chat-markup-bar-background-color-blur-disabled",
    category: ThemeCategory.MarkupBar,
    value: "black",
  },

  // Message
  {
    key: "message-hover-background-color",
    category: ThemeCategory.Message,
    value: "rgba(255, 255, 255, 0.03)",
  },
  {
    key: "message-floating-options-background-color",
    category: ThemeCategory.Message,
    value: "rgb(40, 40, 40)",
  },

  // Accent (Primary)
  { key: "primary-color", category: ThemeCategory.Accent, value: "#4c93ff" },
  {
    key: "primary-color-dark",
    category: ThemeCategory.Accent,
    value: "#2d3746",
  },

  // Alert
  { key: "alert-color", category: ThemeCategory.Alert, value: "#eb6e6e" },
  { key: "alert-color-dark", category: ThemeCategory.Alert, value: "#3e2626" },

  // Warn
  { key: "warn-color", category: ThemeCategory.Warn, value: "#ff8f2c" },
  { key: "warn-color-dark", category: ThemeCategory.Warn, value: "#3a3229" },

  // Success
  { key: "success-color", category: ThemeCategory.Success, value: "#78e380" },
  {
    key: "success-color-dark",
    category: ThemeCategory.Success,
    value: "#1c221d",
  },

  // Status
  { key: "status-offline", category: ThemeCategory.Status, value: "#adadad" },
  { key: "status-online", category: ThemeCategory.Status, value: "#78e380" },
  {
    key: "status-looking-to-play",
    category: ThemeCategory.Status,
    value: "#78a5e3",
  },
  {
    key: "status-away-from-keyboard",
    category: ThemeCategory.Status,
    value: "#e3a878",
  },
  {
    key: "status-do-not-disturb",
    category: ThemeCategory.Status,
    value: "#e37878",
  },

  // Text
  { key: "text-color", category: ThemeCategory.Text, value: "white" },
  {
    key: "content-color",
    category: ThemeCategory.Text,
    value: "rgba(255, 255, 255, 0.8)",
  },
  { key: "side-pane-text-color", category: ThemeCategory.Text, value: "white" },
  {
    key: "typing-indicator-color",
    category: ThemeCategory.Text,
    value: "white",
  },
  {
    key: "typing-indicator-secondary-color",
    category: ThemeCategory.Text,
    value: "rgba(255, 255, 255, 0.7)",
  },

  // Markup
  {
    key: "markup-code-background-color",
    category: ThemeCategory.Markup,
    value: "rgba(0, 0, 0, 0.6)",
  },
  {
    key: "markup-mention-background-color",
    category: ThemeCategory.Markup,
    value: "rgba(0, 0, 0, 0.2)",
  },
  {
    key: "markup-mention-background-color-hover",
    category: ThemeCategory.Markup,
    value: "rgba(0, 0, 0, 0.6)",
  },
  {
    key: "markup-codeblock-background-color",
    category: ThemeCategory.Markup,
    value: "rgba(0, 0, 0, 0.6)",
  },
  {
    key: "markup-spoiler-background-color",
    category: ThemeCategory.Markup,
    value: "#0e0f10",
  },
  {
    key: "markup-spoiler-background-color-hover",
    category: ThemeCategory.Markup,
    value: "#1c1e20",
  },

  // Drawer
  {
    key: "drawer-item-background-color",
    category: ThemeCategory.Drawer,
    value: "rgba(66, 70, 76, 0.6)",
  },
  {
    key: "drawer-item-hover-background-color",
    category: ThemeCategory.Drawer,
    value: "rgba(66, 70, 76, 0.4)",
  },
] as const;

// Get the order of categories as defined in ThemeCategory
const categoryOrder = Object.values(ThemeCategory);

export const ThemeTokens = [...ThemeTokensBase].sort((a, b) => {
  const categoryIndexA = categoryOrder.indexOf(a.category);
  const categoryIndexB = categoryOrder.indexOf(b.category);
  return categoryIndexA - categoryIndexB;
});

type ThemeKey = (typeof ThemeTokensBase)[number]["key"];

export const DefaultTheme = ThemeTokens.reduce(
  (acc, token) => {
    acc[token.key] = token.value;
    return acc;
  },
  {} as Record<ThemeKey, string>,
);

const [customColors, setCustomColors] = useLocalStorage<
  Partial<Record<ThemeKey, string>>
>(StorageKeys.CUSTOM_COLORS, {});

const currentTheme = () => ({ ...DefaultTheme, ...customColors() });

export const updateTheme = () => {
  const newTheme = currentTheme();
  for (const key in newTheme) {
    document.documentElement.style.setProperty(
      `--${key}`,
      newTheme[key as ThemeKey],
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
      "message-hover-background-color": "rgba(255, 255, 255, 0.1)",

      "message-floating-options-background-color": "rgba(15, 15, 15, 1)",

      "markup-spoiler-background-color": "#1d1f20ff",
      "markup-spoiler-background-color-hover": "#2b2e30ff",
    },
    maintainers: ["Asraye"],
  },
};

// Apply a preset
export const applyTheme = (name: string, themeObj?: ThemePreset) => {
  const preset = themeObj || themePresets[name];
  if (!preset || !preset.colors) return;

  // Clear previous
  Object.keys(customColors()).forEach((key) =>
    setThemeColor(key as ThemeKey, undefined),
  );

  // Apply
  Object.entries(preset.colors).forEach(([key, value]) =>
    setThemeColor(key as ThemeKey, value),
  );

  // Persist
  setStorageString(StorageKeys.CUSTOM_COLORS, JSON.stringify(preset.colors));
};

updateTheme();

export const defaultThemeCSSVars = Object.keys(DefaultTheme).reduce(
  (map, key) => {
    map[`--${key}`] = DefaultTheme[key as keyof typeof DefaultTheme];
    return map;
  },
  {} as Record<string, string>,
);

export { DefaultTheme as theme, currentTheme, customColors, setCustomColors };
