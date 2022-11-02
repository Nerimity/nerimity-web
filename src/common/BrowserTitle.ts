import env from "./env";

let title = ""
let alert = false;

export const updateTitle = (newTitle: string) => {
  if (title === title) return;
  title = title;
  update()
}
export const updateTitleAlert = (newAlert: boolean) => {
  if (newAlert === alert) return;
  alert = newAlert;
  update()
}

const update = () => {
  if (title) {
    document.title = `${title} - ${env.APP_NAME}`;
  } else {
    document.title = env.APP_NAME;
  }
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (alert) {
    link.href = "/favicon-alert.ico";
  } else {
    link.href = "/favicon.ico";
  }
    
}

