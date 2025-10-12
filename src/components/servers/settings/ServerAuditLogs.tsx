import { useParams } from "solid-navigator";
import { For, Show, createEffect } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { css, styled } from "solid-styled-components";
import { useTransContext } from "@nerimity/solid-i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import RouterEndpoints from "@/common/RouterEndpoints";
import { RadioBox, RadioBoxItem } from "@/components/ui/RadioBox";
import { updateNotificationSettings } from "@/chat-api/services/UserService";
import { Notice } from "@/components/ui/Notice/Notice";
import ItemContainer from "@/components/ui/LegacyItem";
import Avatar from "@/components/ui/Avatar";
import {
  ChannelType,
  ServerNotificationPingMode,
  ServerNotificationSoundMode,
} from "@/chat-api/RawData";
import Button from "@/components/ui/Button";
import { UsersAuditLogsPane } from "@/components/moderation-pane/UsersAuditLogsPane";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const RadioBoxContainer = styled("div")`
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.05);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 10px;
  padding-left: 50px;
`;

export default function ServerNotificationSettings() {
  const [t] = useTransContext();
  const params = useParams<{ serverId: string; channelId?: string }>();
  const { header, servers, account, channels } = useStore();
  const server = () => servers.get(params.serverId);

  const channel = () => channels.get(params.channelId!);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Audit Logs",
      serverId: params.serverId!,
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem
          href={channel()?.serverId ? "../" : undefined}
          title={t("servers.settings.drawer.audit-logs")}
        />
        <Show when={channel()?.serverId}>
          <BreadcrumbItem title={channel()?.name} />
        </Show>
      </Breadcrumb>
      <UsersAuditLogsPane
        alwaysExpanded
        serverId={params.serverId}
        hideSearchBar
        noMargin
        title="Audit Logs"
      />
    </Container>
  );
}
