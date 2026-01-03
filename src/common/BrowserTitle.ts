import { electronWindowAPI } from "./Electron";

let alert: boolean | null = null;
let count = 0;

export const updateTitleAlert = (newAlert: boolean, newCount?: number) => {
  alert = newAlert;
  if (newCount !== undefined) count = newCount;
  update();
};

const update = () => {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (alert) {
    link.href = "/favicon-alert.ico";
  } else {
    link.href = "/favicon.ico";
  }
  electronWindowAPI()?.setNotification(alert || false, count);
};


window.addEventListener("focus", () => {
  update();
});