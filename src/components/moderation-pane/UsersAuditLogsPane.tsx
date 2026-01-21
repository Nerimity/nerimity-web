import { RawServer, RawUser } from "@/chat-api/RawData";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import { selectedUsers } from "./selectedUsers";
import { User, UserPaneContainer } from "./UserComponents";
import { useModerationUserSuspendedListener } from "@/common/GlobalEvents";
import {
  getUsersAuditLogs,
  UserAuditLog,
} from "@/chat-api/services/ModerationService";
import Input from "../ui/input/Input";
import Button from "../ui/Button";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Text from "../ui/Text";
import { styled } from "solid-styled-components";
import { formatTimestamp } from "@/common/date";
import { getServerAuditLogs } from "@/chat-api/services/ServerService";

const ListContainer = styled("div")`
  display: flex;
  flex-direction: column;

  margin-top: 10px;
  overflow: auto;
`;

export function UsersAuditLogsPane(props: {
  search?: string;
  hideSearchBar?: boolean;
  title?: string;
  alwaysExpanded?: boolean;
  noMargin?: boolean;
  serverId?: string;
}) {
  const LIMIT = 30;
  const [auditLogs, setAuditLogs] = createSignal<UserAuditLog[]>([]);
  const [users, setUsers] = createSignal<RawUser[]>([]);
  const [servers, setServers] = createSignal<RawServer[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);
  const [search, setSearch] = createSignal(props.search || "");

  const [showAll, setShowAll] = createSignal(props.alwaysExpanded ?? false);

  createEffect(
    on(afterId, async () => {
      fetchUsers();
    }),
  );

  const onLoadMoreClick = () => {
    const user = auditLogs()[auditLogs().length - 1];
    setAfterId(user?.id);
  };

  const firstFive = () => auditLogs().slice(0, 5);

  let timeout: number | null = null;
  const onSearchText = (text: string) => {
    setSearch(text);
    timeout && clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      setAfterId(undefined);
      setAuditLogs([]);
      fetchUsers();
      if (!search().trim()) {
        return;
      }
      setShowAll(true);
    }, 1000);
  };

  const fetchUsers = () => {
    setLoadMoreClicked(true);

    (props.serverId
      ? getServerAuditLogs({
          serverId: props.serverId,
          limit: LIMIT,
          afterId: afterId(),
        })
      : getUsersAuditLogs({
          limit: LIMIT,
          afterId: afterId(),
          ...(search().trim ? { query: search().trim() } : {}),
        })
    )
      .then((newUsers) => {
        setAuditLogs([...auditLogs(), ...newUsers.auditLogs]);
        setUsers([...new Set([...users(), ...newUsers.users])]);
        setServers([...new Set([...servers(), ...newUsers.servers])]);
        if (newUsers.auditLogs.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  return (
    <UserPaneContainer
      class="pane users"
      expanded={showAll()}
      style={{
        ...(!showAll() ? { height: "initial" } : undefined),
        ...(props.noMargin ? { margin: 0 } : {}),
        ...(props.alwaysExpanded
          ? { height: "initial", resize: "none" }
          : undefined),
      }}
    >
      <Show when={!props.hideSearchBar}>
        <Input
          placeholder="Search"
          margin={[10, 10, 10, 30]}
          onText={onSearchText}
          value={search()}
        />
      </Show>
      <Show when={props.hideSearchBar}>
        <div style={{ height: "10px" }} />
      </Show>
      <FlexRow
        gap={5}
        itemsCenter
        style={{
          "padding-left": "10px",
          "padding-top": props.alwaysExpanded ? "4px" : "0px",
          "flex-shrink": "0",
        }}
      >
        <Show when={!props.alwaysExpanded}>
          <Button
            iconName="add"
            iconSize={14}
            padding={4}
            onClick={() => setShowAll(!showAll())}
          />
        </Show>
        <Text>{props.title || "User Audit Logs"}</Text>
      </FlexRow>
      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : auditLogs()}>
          {(auditLog) => (
            <AuditLogItem users={users()} servers={servers()} item={auditLog} />
          )}
        </For>
        <Show when={showAll() && !loadMoreClicked()}>
          <Button
            iconName="refresh"
            label="Load More"
            onClick={onLoadMoreClick}
          />
        </Show>
      </ListContainer>
    </UserPaneContainer>
  );
}

const AuditLogItemContainer = styled(FlexColumn)`
  border-top: solid 1px rgba(0, 0, 0, 0.4);
  padding: 6px;
`;

const AuditLogItem = (props: {
  item: UserAuditLog;
  users: RawUser[];
  servers: RawServer[];
}) => {
  const actionBy = () => {
    const actionById = props.item.actionById;
    if (!actionById) return;
    return props.users.find((u) => u.id === actionById);
  };
  const server = () => {
    const serverId = props.item.serverId;
    if (!serverId) return;
    return props.servers.find((s) => s.id === serverId);
  };

  const serverName = () => {
    return props.item.data?.serverName || server()?.name;
  };

  const actionTo = () => {
    const kickedUserId = props.item.data?.kickedUserId;
    const unbannedUserId = props.item.data?.unbannedUserId;
    const bannedUserId = props.item.data?.bannedUserId;
    if (!kickedUserId && !bannedUserId && !unbannedUserId) return;
    const user = props.users.find(
      (u) => u.id === (kickedUserId || bannedUserId || unbannedUserId),
    );
    const action = kickedUserId
      ? "Kicked"
      : unbannedUserId
        ? "Unbanned"
        : "Banned";
    return {
      user,
      action,
    };
  };

  const rawData = () => {
    return Object.entries(props.item.data || {});
  };

  const timestamp = () => {
    return formatTimestamp(props.item.createdAt);
  };
  return (
    <AuditLogItemContainer>
      <Text size={14}>{props.item.actionType}</Text>
      <Text size={14}>
        <Text size={14} opacity={0.6}>
          By:
        </Text>{" "}
        {actionBy()?.username}
      </Text>
      <Show when={actionTo()}>
        <Text size={14}>
          <Text size={14} opacity={0.6}>
            {actionTo()?.action}:
          </Text>{" "}
          {actionTo()?.user?.username}
        </Text>
      </Show>
      <Show when={serverName() !== undefined}>
        <Text size={14}>
          <Text size={14} opacity={0.6}>
            Server:
          </Text>{" "}
          {serverName()}
        </Text>
      </Show>
      <Text size={14} opacity={0.6}>
        At {timestamp()}
      </Text>
      <Show when={!actionTo()}>
        <div>
          <For each={rawData()}>
            {([key, value]) => (
              <Text size={14}>
                <Text size={14} opacity={0.6}>
                  {key}:
                </Text>{" "}
                {typeof value === "string" ? value : JSON.stringify(value)}{" "}
              </Text>
            )}
          </For>
        </div>
      </Show>
    </AuditLogItemContainer>
  );
};
