import { css, styled } from "solid-styled-components";
import { FlexRow } from "./ui/Flexbox";
import Text from "./ui/Text";
import Button from "./ui/Button";
import { electronWindowAPI } from "@/common/Electron";
import Icon from "./ui/icon/Icon";
import { classNames } from "@/common/classNames";

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
  border-radius: 4px;
  background-color: transparent;
  border: none;
  color: white;
  transition: 0.1s;
`;

const minimize = css`
  &:hover {
    background-color: rgba(255,255,255,0.1);
    color: var(--warn-color);
  }
`;

const full = css`
  &:hover {
    background-color: rgba(255,255,255,0.1);
    color: var(--success-color);
  }
`;

const close = css`
  &:hover {
    background-color: rgba(255,255,255,0.1);
    color: var(--alert-color);
  }
`;


const IconImage = styled("img")`
  height: 20px;
  border-radius: 50%;
  margin-left: 10px;
  pointer-events: none;
  background-color: #353535;
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
        <Icon onClick={electronWindowAPI()?.minimize} class={classNames(windowControlButtonStyles, minimize)} name="horizontal_rule" size={16} />
        <Icon onClick={electronWindowAPI()?.toggleMaximize} class={classNames(windowControlButtonStyles, full)} name="check_box_outline_blank" size={16} />
        <Icon onClick={electronWindowAPI()?.close} class={classNames(windowControlButtonStyles, close)} name="close" size={18} />
      </WindowControlButtonsContainer>
    </BarContainer>
  );
}