import env from "@/common/env";
import { appLogoUrl } from "@/common/worldEvents";
import { Link } from "@solidjs/router";
import { css, styled } from "solid-styled-components";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Icon from "./ui/icon/Icon";
import Modal from "./ui/modal/Modal";
import Text from "./ui/Text";




const ItemContainer = styled(FlexRow)`
  align-items: center;
  padding: 5px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  min-height: 45px;
  background: rgba(255,255,255,0.1);
  &:hover {
    opacity: 0.7;
  }
  span {
    margin-left: 5px;
  }
`;



export function WelcomeModal (props: {close: () => void}) {

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button label="Continue" iconName="arrow_forward" onClick={props.close} />
    </FlexRow>
  )


  return (
    <Modal ignoreBackgroundClick  title={`Welcome to ${env.APP_NAME}!`} maxWidth={600} actionButtons={ActionButtons} >
      <FlexColumn gap={8} style={{"max-height": "400px", "max-width": "900px", height: "100%", flex: "1", padding: "10px"}}>
        <Text>Thanks for trying out {env.APP_NAME}!</Text>
        <EditProfileItem />
        <ServerItem/>
        <SourceCodeItem />
        <SupportItem />
      </FlexColumn>
    </Modal>
  )
}

function ServerItem() {
  return (
    <Link href={`${env.APP_URL}/app/explore/servers/invites/${env.OFFICIAL_SERVER}`} target="_blank" style={{"text-decoration": "none"}}>
      <ItemContainer gap={5} >
        <Icon name="dns" />
        <Text size={16} style={{flex: 1}} >Join the official {env.APP_NAME} server!</Text>
        <Icon name="open_in_new" />
      </ItemContainer>
    </Link>
  );
}

function EditProfileItem() {
  return (
    <Link href="/app/settings/account" target="_blank" style={{"text-decoration": "none"}}>
      <ItemContainer gap={5} >
        <Icon name="edit" />
        <Text size={16} style={{flex: 1}} >Edit my profile</Text>
        <Icon name="open_in_new" />
      </ItemContainer>
    </Link>
  );
}

function SupportItem() {
  return (
    <Link href="https://ko-fi.com/supertiger" target="_blank" style={{"text-decoration": "none"}}>
      <ItemContainer gap={5}>
        <Icon name="favorite" />
        <Text style={{flex: 1}} size={16}>Support me on Ko-fi</Text>
        <Icon name="open_in_new" />
      </ItemContainer>
    </Link>
  );
}
function SourceCodeItem() {
  return (
    <Link href="https://github.com/Nerimity" target="_blank" style={{"text-decoration": "none"}}>
      <ItemContainer gap={5}>
        <Icon name="code" />
        <Text style={{flex: 1}} size={16}>Contribute to {env.APP_NAME} on GitHub</Text>
        <Icon name="open_in_new" />
      </ItemContainer>
    </Link>
  );
}
