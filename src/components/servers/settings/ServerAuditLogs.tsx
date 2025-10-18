import { useParams } from "solid-navigator";
import { Show, createEffect } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { styled } from "solid-styled-components";
import { useTransContext } from "@nerimity/solid-i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import RouterEndpoints from "@/common/RouterEndpoints";

import { UsersAuditLogsPane } from "@/components/moderation-pane/UsersAuditLogsPane";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function ServerNotificationSettings() {
  const [t] = useTransContext();
  const params = useParams<{ serverId: string; channelId?: string }>();
  const { header, servers, channels } = useStore();
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
