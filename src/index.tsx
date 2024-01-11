/* @refresh reload */
import "./init";
import { render } from "solid-js/web";
import "material-icons/iconfont/round.scss";
import "./index.css";
import App from "./App";
import { CustomPortalProvider } from "@/components/ui/custom-portal/CustomPortal";
import { Router } from "@solidjs/router";
import en from "@/locales/list/en-gb.json";
import { TransProvider } from "@mbarzda/solid-i18next";
import styles from "./Index.module.scss";
import { useWindowProperties } from "./common/useWindowProperties";
import { createEffect, on } from "solid-js";

render(() => {
  const { isMobileAgent, blurEffectEnabled } = useWindowProperties();

  createEffect(on(blurEffectEnabled, () => {
    if (blurEffectEnabled()) {
      document.body.classList.remove("disableBlur");
    } else {
      document.body.classList.add("disableBlur");
    }
  }))

  if (!isMobileAgent()) {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      /* width */
      *::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
    
      /* Track */
      *::-webkit-scrollbar-track {
        background-color: rgba(48, 48, 48, 0.4);
        border-top-right-radius: 7px;
        border-bottom-right-radius: 7px;
      }
    
      /* Handle */
      *::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 8px;
    
      }
    `;
    document.head.appendChild(styleEl);
  }

  return (
      <Router>
        <TransProvider
          options={{
            fallbackLng: "en_gb",
            lng: "en_gb",
            resources: { en_gb: { translation: en } },
          }}
        >
          <CustomPortalProvider>
            <App />
          </CustomPortalProvider>
        </TransProvider>
      </Router>
  );
}, document.getElementById("root") as HTMLElement);
