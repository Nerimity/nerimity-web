import { Show } from "solid-js";
import { Channel } from "@/chat-api/store/useChannels";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CustomLink } from "../ui/CustomLink";
import { CHANNEL_PERMISSIONS, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import Icon from "../ui/icon/Icon";
import { t } from "@nerimity/i18lite";
import useServerMembers from "@/chat-api/store/useServerMembers";
import useAccount from "@/chat-api/store/useAccount";

export function MentionChannel(props: { channel: Channel }) {
  const serverMembers = useServerMembers();
  const account = useAccount();

  const canView = () => {
    const channel = props.channel;
    if (!channel || !channel.serverId) return false;
    const member = serverMembers.get(channel.serverId, account.user()?.id!);
    const hasAdminPerm = serverMembers.hasPermission(
      member!,
      ROLE_PERMISSIONS.ADMIN
    );
    if (hasAdminPerm) return true;
    return channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL);
  };

  return (
    <Show
      when={canView()}
      fallback={
        <span
          class="mention hidden-mention"
          style={{
            display: "inline-flex",
            "align-items": "center",
            gap: "4px",
            position: "relative",
            cursor: "not-allowed",
            "vertical-align": "middle"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              "z-index": 1,
              "background-color": "transparent"
            }}
          />
          <Icon name="lock" size={14} style={{ color: "var(--primary)" }} />
          <span style={{ "white-space": "nowrap" }}>
            {t("servers.channelPermissions.hiddenChannel")}
          </span>
        </span>
      }
    >
      <CustomLink
        href={RouterEndpoints.SERVER_MESSAGES(
          props.channel!.serverId!,
          props.channel!.id
        )}
        class="mention"
      >
        <span class="type">#</span>
        {props.channel!.name}
      </CustomLink>
    </Show>
  );
}
