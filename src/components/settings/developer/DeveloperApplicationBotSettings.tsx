import { For, Show, createEffect, createSignal, onMount } from "solid-js";
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

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function DeveloperApplicationBotSettings() {
  const { header } = useStore();
  const params = useParams<{id: string}>();
  const [error, setError] = createSignal<string | null>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer Application Bot",
      iconName: "settings"
    });
  });

  const [application, setApplication] = createSignal<RawApplication | null>(null);

  onMount(async () => {
    const app = await getApplication(params.id);
    setApplication(app);
  });


  const onSaveClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);


    await updateAppBotUser(params.id, updatedInputValues())
      .then((newUser) => {
        setApplication({...application()!, botUser: newUser});
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setRequestSent(false));

  
  };

  const defaultInput = () => ({
    username: application()?.botUser?.username || "",
    tag: application()?.botUser?.tag || ""
  });

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);

  const requestStatus = () => requestSent() ? "Saving..." : "Save Changes";

  let token: string | null = null;
  const copyToken = async () => {
    if (token) {
      navigator.clipboard.writeText(token);
      return alert("Copied token to clipboard.");
    }
    const res = await getAppBotToken(params.id);
    token = res.token;
    navigator.clipboard.writeText(token);
    alert("Copied token to clipboard.");
  };
  
  const onRefreshClick = async () => {
    token = null;
    refreshAppBotToken(params.id).then(() => {
      alert("Token refreshed.");
    }).catch(err => {
      alert(err.message);
    });
  };


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem href="/app/settings/developer" title={t("settings.drawer.developer")} />
        <BreadcrumbItem href="/app/settings/developer/applications" title={t("settings.drawer.applications")} />
        <BreadcrumbItem href="../" title={application() ? application()!.name : "loading..."} />
        <BreadcrumbItem title="Bot" />
      </Breadcrumb>


  
      <Show when={application()}>

        <SettingsBlock icon='link' label='Create Invite Link' href="./create-link">
          <Icon name="keyboard_arrow_right" />
        </SettingsBlock>


        
        <SettingsBlock icon='key' label='Token' class={css`margin-bottom: 20px;`}>
          <Button label="Refresh" onClick={onRefreshClick} iconName="refresh"/>
          <Button onClick={copyToken} label="Copy" iconName="content_copy"/>
        </SettingsBlock>

        <SettingsBlock icon='face' label='Username'>
          <Input value={inputValues().username} onText={(v) => setInputValue("username", v)} />
        </SettingsBlock>

        <SettingsBlock icon='local_offer' label='Tag'>
          <Input class={css`width: 52px;`} value={inputValues().tag} onText={(v) => setInputValue("tag", v)} />
        </SettingsBlock>


        <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
        <Show when={Object.keys(updatedInputValues()).length}>
          <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveClicked} />
        </Show>

      </Show>

    </Container>
  );
}

