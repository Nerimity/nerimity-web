import style from "./ElectronTitleBar.module.css";
import { electronWindowAPI } from "@/common/Electron";
import Icon from "./ui/icon/Icon";
import { cn } from "@/common/classNames";
import { createSignal } from "solid-js";

export function ElectronTitleBar() {
  return (
    <div class={style.barContainer}>
      <img class={style.nerimityLogo} src="/assets/logo.png" />
      <span class={style.nerimityTitle}>Nerimity</span>
      <div class={style.windowControlButtonsContainer}>
        <CopyLinkButton />
        <Icon
          onClick={electronWindowAPI()?.minimize}
          class={cn(style.windowControlButton, style.minimize)}
          name="horizontal_rule"
          size={16}
        />
        <Icon
          onClick={electronWindowAPI()?.toggleMaximize}
          class={cn(style.windowControlButton, style.full)}
          name="check_box_outline_blank"
          size={16}
        />
        <Icon
          onClick={electronWindowAPI()?.close}
          class={cn(style.windowControlButton, style.close)}
          name="close"
          size={18}
        />
      </div>
    </div>
  );
}

const CopyLinkButton = () => {
  const [clicked, setClicked] = createSignal(false);
  const copyLinkClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 1000);
    navigator.clipboard.writeText(window.location.href);
  };
  return (
    <Icon
      onClick={copyLinkClick}
      title="Copy Page URL"
      class={cn(
        style.windowControlButton,
        style.copyLink,
        clicked() && style.clicked
      )}
      name="link"
      size={16}
    />
  );
};
