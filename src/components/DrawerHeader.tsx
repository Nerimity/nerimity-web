import { JSXElement, Match, Show, Switch } from "solid-js";
import { styled } from "solid-styled-components";
import { FlexRow } from "./ui/Flexbox";
import Text from "./ui/Text";

const DrawerHeaderContainer = styled(FlexRow)`
  display: flex;
  overflow: hidden;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 45px;
  border-bottom: solid 1px rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  align-items: center;
  user-select: none;
  transition: 0.2s;
  z-index: 11111;
  background-color: rgba(48, 48, 48, 0.4);
  backdrop-filter: blur(20px);
  margin-bottom: 3px;
  width: 100%;
`;

export function DrawerHeader(props: {children?: JSXElement, text?: string}) {
  return (
    <DrawerHeaderContainer>
      <Switch fallback={props.children}>
        <Match when={props.text}><Text style={{"margin-left": "10px"}} size={16}>{props.text}</Text></Match>
      </Switch>
    </DrawerHeaderContainer>
  )

}