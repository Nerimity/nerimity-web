import { css, styled } from "solid-styled-components";
import { FlexRow } from "./ui/Flexbox";
import Text from "./ui/Text";
import Button from "./ui/Button";
import { electronWindowAPI } from "@/common/Electron";
import Icon from "./ui/icon/Icon";
import { classNames } from "@/common/classNames";
import { createSignal } from "solid-js";

const BarContainer = styled(FlexRow)`
  height: 35px;
  align-items: center;
  user-select: none;
  -webkit-app-region: drag;
`;

const WindowControlButtonsContainer = styled(FlexRow)`
  margin-left: auto;
  margin-right: 4px;
  -webkit-app-region: no-drag;
`;

const windowControlButtonStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 20px;
  padding: 5px;
  border-radius: 8px;
  background-color: transparent;
  border: none;
  color: white;
  transition: 0.1s;
`;

const minimize = css`
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--warn-color);
  }
`;
const copyLink = css`
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--primary-color);
  }
`;

const full = css`
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--success-color);
  }
`;

const close = css`
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--alert-color);
  }
`;

const IconImage = styled("img")`
  height: 20px;
  margin-left: 10px;
  pointer-events: none;
  background-color: rgb(38, 38, 38);
`;

const TitleText = styled(Text)`
  font-size: 12px;
  margin-left: 5px;
`;

export function ElectronTitleBar() {
  return (
    <BarContainer>
      <IconImage src="/assets/logo.png" />
      <TitleText>Nerimity</TitleText>
      <WindowControlButtonsContainer>
        <CopyLinkButton />
        <Icon
          onClick={electronWindowAPI()?.minimize}
          class={classNames(windowControlButtonStyles, minimize)}
          name="horizontal_rule"
          size={16}
        />
        <Icon
          onClick={electronWindowAPI()?.toggleMaximize}
          class={classNames(windowControlButtonStyles, full)}
          name="check_box_outline_blank"
          size={16}
        />
        <Icon
          onClick={electronWindowAPI()?.close}
          class={classNames(windowControlButtonStyles, close)}
          name="close"
          size={18}
        />
      </WindowControlButtonsContainer>
    </BarContainer>
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
      class={classNames(
        windowControlButtonStyles,
        copyLink,
        clicked()
          ? css`
              background: var(--success-color);
              &:hover {
                background: var(--success-color);
                color: white;
              }
            `
          : undefined
      )}
      name="link"
      size={16}
    />
  );
};
