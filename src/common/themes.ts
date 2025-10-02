import { StorageKeys, useLocalStorage } from "./localStorage";
import { isHalloween } from "./worldEvents";

const DarkTheme = {
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

// const LightTheme = {
// "background-color": "#f1f1f1",
// "pane-color": "white",
// "header-background-color": "white",
// "header-background-color-blur-disabled": "white",
// "text-color": "black",
// };

const theme = { ...DarkTheme };

// if (isHalloween) {
//   theme["primary-color"] = "#d76623";
//   theme["primary-color-dark"] = "#241e1a";
//   theme["alert-color"] = "#866ebf";
//   theme["alert-color-dark"] = "#27242e";
// }
// if (isChristmas) {
//   document.documentElement.style.setProperty("--primary-color", "#34a65f");
//   document.documentElement.style.setProperty("--primary-color-dark", "#222c26");
// }

export { theme };

type ThemeKey = keyof typeof theme;

const [customColors, setCustomColors] = useLocalStorage<
  Partial<Record<ThemeKey, string>>
>(StorageKeys.CUSTOM_COLORS, {});

const currentTheme = () => ({ ...theme, ...customColors() });

export const updateTheme = () => {
  const newTheme = currentTheme();

  for (const key in newTheme) {
    document.documentElement.style.setProperty(
      `--${key}`,
      newTheme[key as ThemeKey],
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
