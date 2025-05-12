import { Show, createEffect} from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Button from "../ui/Button";
import { createGoogleAccountLink, unlinkAccountWithGoogle } from "@/chat-api/services/UserService";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function ConnectionsSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.connections"),
      iconName: "settings"
    });
  });


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.connections")} />
      </Breadcrumb>
      <Connections/>
    </Container>
  );
}


function Connections() {


  return (
    <>
      <GoogleLink/>
    </>
  );
}

function GoogleLink() {
  const {account} = useStore();
  const isConnected = () => account.user()?.connections?.find(c => c.provider === "GOOGLE");

  const linkGoogle = () => {
    createGoogleAccountLink().then(url => {
      window.open(url, "_blank");
    }).catch(err => {
      alert(err.message);
    });
  };
  const unlinkGoogle = async () => {
    await unlinkAccountWithGoogle().catch(err => {
      alert(err.message);
    });
  };
  
  return (
    <SettingsBlock iconSrc='/assets/Google.svg' label='Google' description={t("settings.connections.description")}>
      <Show when={!isConnected()}><Button label={t("settings.connections.linkButton")} iconName='link' onClick={linkGoogle}  /></Show>
      <Show when={isConnected()}><Button label={t("settings.connections.unlinkButton")} color='var(--alert-color)' iconName='link_off' onClick={unlinkGoogle}  /></Show>
    </SettingsBlock>
  );


}
