import { electronWindowAPI } from "./Electron";

let alert: boolean | null = null;

export const updateTitleAlert = (newAlert: boolean) => {
  if (newAlert === alert) return;
  alert = newAlert;
  update();
};

const update = () => {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (alert) {
    link.href = "/favicon-alert.ico";
  } else {
    link.href = "/favicon.ico";
  }
  electronWindowAPI()?.setNotification(alert || false);
};
