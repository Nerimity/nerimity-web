import {
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  onMount,
} from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import { t } from "@nerimity/i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import {
  getAppBotToken,
  getApplication,
  refreshAppBotToken,
} from "@/chat-api/services/ApplicationService";
import { RawApplication } from "@/chat-api/RawData";
import { useLocation, useParams } from "solid-navigator";
import { EditAccountPage } from "../AccountSettings";
import SettingsHeader from "../SettingsHeader";
import { EditProfilePage } from "../ProfileSettings";
import PublishBotAppSettings from "./PublishBotAppSettings";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function DeveloperApplicationBotSettings() {
  const { header } = useStore();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const [token, setToken] = createSignal<string | null>(null);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Developer Application Bot",
      iconName: "settings",
    });
  });

  const [application, setApplication] = createSignal<RawApplication | null>(
    null
  );

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
    refreshAppBotToken(params.id)
      .then(async () => {
        const res = await getAppBotToken(params.id);
        setToken(res.token);
        alert("Token refreshed.");
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  const showBotPage = () => location.pathname.endsWith("/bot");
  const showProfilePage = () => location.pathname.endsWith("/profile");
  const showPublishPage = () => location.pathname.endsWith("/publish");

  return (
    <Container>
      <Show when={application()}>
        <SettingsHeader bot={application()?.botUser} />
        <Breadcrumb style={{ "margin-top": "18px" }}>
          <BreadcrumbItem
            href="/app"
            icon="home"
            title={t("dashboard.title")}
          />
          <BreadcrumbItem
            href="/app/settings/developer"
            title={t("settings.drawer.developer")}
          />
          <BreadcrumbItem
            href="/app/settings/developer/applications"
            title={t("settings.drawer.applications")}
          />
          <BreadcrumbItem
            href="../"
            title={application() ? application()!.name : "loading..."}
          />
          <BreadcrumbItem
            title="Bot"
            href={showProfilePage() ? "../" : undefined}
          />
          <Show when={showProfilePage()}>
            <BreadcrumbItem title="Profile" />
          </Show>
        </Breadcrumb>

        <SettingsBlock
          icon="link"
          label="Create Invite Link"
          href="./create-link"
        >
          <Icon name="keyboard_arrow_right" />
        </SettingsBlock>

        <SettingsBlock
          icon="key"
          label="Token"
          class={css`
            margin-bottom: 20px;
          `}
        >
          <Button label="Refresh" onClick={onRefreshClick} iconName="refresh" />
          <Button onClick={copyToken} label="Copy" iconName="content_copy" />
        </SettingsBlock>

        <Show when={showBotPage()}>
          <SettingsBlock
            icon="explore"
            label="Publish Bot"
            description="Publish your bot to the explore page so other users can find it."
            href="./publish"
          >
            <Icon name="keyboard_arrow_right" />
          </SettingsBlock>
        </Show>

        <Show when={token()}>
          <Switch>
            <Match when={showBotPage()}>
              <EditAccountPage
                bot={application()?.botUser}
                botToken={token()}
                onUpdated={fetchApp}
              />
            </Match>
            <Match when={showProfilePage()}>
              <EditProfilePage
                bot={application()?.botUser}
                botToken={token()}
              />
            </Match>
            <Match when={showPublishPage()}>
              <PublishBotAppSettings />
            </Match>
          </Switch>
        </Show>
      </Show>
    </Container>
  );
}
