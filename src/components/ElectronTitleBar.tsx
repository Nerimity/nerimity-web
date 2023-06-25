import { css, styled } from "solid-styled-components"
import { FlexRow } from "./ui/Flexbox"
import Text from "./ui/Text";
import Button from "./ui/Button";
import { electronWindowAPI } from "@/common/Electron";

const BarContainer = styled(FlexRow)`
  height: 30px;
  align-items: center;
  user-select: none;
  -webkit-app-region: drag;
`;

const WindowControlButtonsContainer = styled(FlexRow)`
  margin-left: auto;
  margin-right: 4px;
  -webkit-app-region: no-drag;
`

const windowControlButtonStyles = css`
  width: 30px;
  height: 12px;
  border-radius: 4px;
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
        <Button onClick={electronWindowAPI()?.minimize} margin={1} class={windowControlButtonStyles} label="M" />
        <Button onClick={electronWindowAPI()?.toggleMaximize} margin={1} class={windowControlButtonStyles} label="R" />
        <Button onClick={electronWindowAPI()?.close} margin={1} class={windowControlButtonStyles} label="C" />
      </WindowControlButtonsContainer>
    </BarContainer>
  )
}