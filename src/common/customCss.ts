import { getStorageString, StorageKeys } from "./localStorage";

export const applyCustomCss = () => {
  let style = document.getElementById("custom-css");
  const css = getStorageString(StorageKeys.CUSTOM_CSS, "");

  if (!css.trim().length) {
    if (style) {
      style.innerHTML = css;
    }
    return;
  }

  if (!style) {
    style = document.createElement("style");
    style.id = "custom-css";
    document.head.appendChild(style);
  }
  style.innerHTML = css;
};
