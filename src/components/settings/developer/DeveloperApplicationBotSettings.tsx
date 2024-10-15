import { For, Match, Show, Switch, createEffect, createSignal, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { createAppBotUser, createApplication, getAppBotToken, getApplication, getApplications, refreshAppBotToken, updateAppBotUser } from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { createStore, reconcile } from "solid-js/store";
import { useLocation, useNavigate, useParams } from "solid-navigator";
import Input from "@/components/ui/input/Input";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { CustomLink } from "@/components/ui/CustomLink";
import Text from "@/components/ui/Text";
import { EditAccountPage } from "../AccountSettings";
import SettingsHeader from "../SettingsHeader";
import { EditProfilePage } from "../ProfileSettings";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function DeveloperApplicationBotSettings() {
  const { header } = useStore();
  const params = useParams<{id: string}>();
  const location = useLocation();
  const [token, setToken] = createSignal<string | null>(null);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer Application Bot",
      iconName: "settings"
    });
  });

  const [application, setApplication] = createSignal<RawApplication | null>(null);


  const fetchApp = async () => {
    const app = await getApplication(params.id);
    setApplication(app);
  };

  onMount(async () => {
    await fetchApp();
    
    const res = await getAppBotToken(params.id);
    setToken(res.token);
  });



  const copyToken = async () => {
    if (token()) {
      navigator.clipboard.writeText(token()!);
      return alert("Copied token to clipboard.");
    }
    const res = await getAppBotToken(params.id);
    setToken(res.token);
    navigator.clipboard.writeText(token()!);
    alert("Copied token to clipboard.");
  };
  
  const onRefreshClick = async () => {
    refreshAppBotToken(params.id).then(async () => {
      const res = await getAppBotToken(params.id);
      setToken(res.token);
      alert("Token refreshed.");
    }).catch(err => {
      alert(err.message);
    });
  };
  

  const showProfilePage = () => location.pathname.endsWith("/profile");


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem href="/app/settings/developer" title={t("settings.drawer.developer")} />
        <BreadcrumbItem href="/app/settings/developer/applications" title={t("settings.drawer.applications")} />
        <BreadcrumbItem href="../" title={application() ? application()!.name : "loading..."} />
        <BreadcrumbItem title="Bot" href={showProfilePage() ? "../": undefined} />
        <Show when={showProfilePage()}>
          <BreadcrumbItem title="Profile" />
        </Show>
      </Breadcrumb>


  
      <Show when={application()}>

        <SettingsHeader bot={application()?.botUser} />


        <SettingsBlock icon='link' label='Create Invite Link' href="./create-link">
          <Icon name="keyboard_arrow_right" />
        </SettingsBlock>


        
        <SettingsBlock icon='key' label='Token' class={css`margin-bottom: 20px;`}>
          <Button label="Refresh" onClick={onRefreshClick} iconName="refresh"/>
          <Button onClick={copyToken} label="Copy" iconName="content_copy"/>
        </SettingsBlock>







        <Show when={token()}>
          <Switch>
            <Match when={!showProfilePage()}>
              <EditAccountPage bot={application()?.botUser} botToken={token()} onUpdated={fetchApp}/>
            </Match>
            <Match when={showProfilePage()}>
              <EditProfilePage bot={application()?.botUser} botToken={token()} onUpdated={fetchApp}/>
            </Match>
          </Switch>
        </Show>



      </Show>

    </Container>
  );
}

