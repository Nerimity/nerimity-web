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
import { toast } from "@/components/ui/custom-portal/CustomPortal";

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
      title: t("settings.drawer.title") + " - " + t("settings.drawer.developer"),
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
      return toast(t("settings.developer.bot.tokenCopied"));
    }
    const res = await getAppBotToken(params.id);
    setToken(res.token);
    navigator.clipboard.writeText(token()!);
    toast(t("settings.developer.bot.tokenCopied"));
  };

  const onRefreshClick = async () => {
    refreshAppBotToken(params.id)
      .then(async () => {
        const res = await getAppBotToken(params.id);
        setToken(res.token);
        toast(t("settings.developer.bot.tokenRefreshed"));
      })
      .catch((err) => {
        toast(err.message);
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
            title={t("message.badge.bot")}
            href={showProfilePage() ? "../" : undefined}
          />
          <Show when={showProfilePage()}>
            <BreadcrumbItem title={t("settings.drawer.profile")} />
          </Show>
        </Breadcrumb>

        <SettingsBlock
          icon="link"
          label={t("settings.developer.bot.createInvite")}
          href="./create-link"
        >
          <Icon name="keyboard_arrow_right" />
        </SettingsBlock>

        <SettingsBlock
          icon="key"
          label={t("settings.developer.bot.token")}
          class={css`
            margin-bottom: 20px;
          `}
        >
          <Button onClick={onRefreshClick} label={t("settings.developer.refreshButton")} iconName="refresh" />
          <Button onClick={copyToken} label={t("inputFieldActions.copy")} iconName="content_copy" />
        </SettingsBlock>

        <Show when={showBotPage()}>
          <SettingsBlock
            icon="explore"
            label={t("settings.developer.bot.publishBot")}
            description={t("settings.developer.bot.publishBotDescription")}
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
