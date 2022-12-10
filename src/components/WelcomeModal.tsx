import env from "@/common/env";
import { appLogoUrl } from "@/common/worldEvents";
import { Link } from "@nerimity/solid-router";
import { css, styled } from "solid-styled-components";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Icon from "./ui/icon/Icon";
import Modal from "./ui/Modal";
import Text from "./ui/Text";

const modalStyles = css`
  width: 400px;
`;


const ItemContainer = styled(FlexRow)`
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    opacity: 0.7;
  }
`;



export function WelcomeModal (props: {close: () => void}) {

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button label="Continue" iconName="arrow_forward" onClick={props.close} />
    </FlexRow>
  )


  return (
    <Modal ignoreBackgroundClick class={modalStyles} title={`Welcome to ${env.APP_NAME}!`} close={props.close} actionButtons={ActionButtons} >
      <FlexColumn gap={10} style={{"max-height": "400px", "max-width": "900px", height: "100%", flex: "1"}}>
        <Text>Welcome to {env.APP_NAME}!</Text>
        <ServerItem onClick={props.close} />
        <SupportItem />
      </FlexColumn>
    </Modal>
  )
}

function ServerItem(props: {onClick: () => void;}) {
  return (
    <Link href="https://nerimity.com/app/explore/servers/invites/nerimity" style={{"text-decoration": "none"}} onclick={props.onClick}>
      <ItemContainer gap={5} style={{background: "var(--primary-color)"}}>
        <Avatar hexColor="white" size={24} />
        <Text size={16}>Join the official Nerimity server!</Text>
      </ItemContainer>
    </Link>
  );
}
function SupportItem() {
  return (
    <Link href="https://ko-fi.com/supertiger" target="_blank" style={{"text-decoration": "none"}}>
      <ItemContainer gap={5} style={{background: "var(--alert-color)"}}>
        <Icon name="favorite" />
        <Text style={{flex: 1}} size={16}>Support me on Ko-fi</Text>
        <Icon name="open_in_new" />
      </ItemContainer>
    </Link>
  );
}
