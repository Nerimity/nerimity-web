import useStore from "@/chat-api/store/useStore";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  lazy,
  on,
  onMount,
  Show,
} from "solid-js";
import {
  AuditLog,
  AuditLogType,
  getAuditLog,
  getOnlineUsers,
  getServers,
  getStats,
  getTickets,
  getUsers,
  ModerationStats,
  ModerationSuspension,
  ModerationUser,
  searchServers,
  searchUsers,
} from "@/chat-api/services/ModerationService";
import Avatar from "../ui/Avatar";
import { formatTimestamp } from "@/common/date";
import { Link, Route, Routes, useMatch } from "@solidjs/router";
import { RawServer, RawUser, TicketStatus } from "@/chat-api/RawData";
import Button from "../ui/Button";
import { css, styled } from "solid-styled-components";
import Text from "../ui/Text";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Checkbox from "../ui/Checkbox";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import SuspendUsersModal from "./SuspendUsersModal";
import { CustomLink } from "../ui/CustomLink";
import RouterEndpoints from "@/common/RouterEndpoints";
import Input from "../ui/input/Input";
import { useWindowProperties } from "@/common/useWindowProperties";
import Icon from "../ui/icon/Icon";

import {
  emitModerationUserSuspended,
  useModerationUserSuspendedListener,
} from "@/common/GlobalEvents";
import { Notice } from "../ui/Notice";
import SettingsBlock from "../ui/settings-block/SettingsBlock";

const UserPage = lazy(() => import("./UserPage"));
const ServerPage = lazy(() => import("./ServerPage"));

const [stats, setStats] = createSignal<ModerationStats | null>(null);

const [selectedUsers, setSelectedUsers] = createSignal<any[]>([]);
const isUserSelected = (id: string) => selectedUsers().find((u) => u.id === id);

const ModerationPaneContainer = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  align-self: center;
  margin-top: 10px;
  a {
    text-decoration: none;
  }
`;

const UserColumn = styled(FlexColumn)`
  overflow: auto;
  flex-shrink: 0;
`;

const PaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px;
  flex-shrink: 0;
  margin: 5px;
  margin-left: 10px;
  margin-right: 10px;
  max-height: 500px;
`;

const UserPaneContainer = styled(PaneContainer)`
  flex: 1;
`;

const ListContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 10px;
  overflow: auto;
`;

const itemStyles = css`
  display: flex;
  flex-shrink: 0;
  gap: 5px;
  align-items: center;
  padding: 5px;
  padding-left: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  text-decoration: none;
  color: white;
  .checkbox {
    margin-right: 10px;
  }

  &:hover {
    background-color: rgb(66, 66, 66);
  }
`;

const avatarStyle = css`
  place-self: start;
  margin-top: 3px;
`;

const linkStyle = css`
  &:hover {
    text-decoration: underline;
  }
`;

const ItemDetailContainer = styled("div")`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default function ModerationPane() {
  const { account, header } = useStore();
  const [load, setLoad] = createSignal(false);
  const { isMobileWidth } = useWindowProperties();

  createEffect(() => {
    if (!account.isAuthenticated() || !account.hasModeratorPerm()) return;
    header.updateHeader({
      title: "Moderation",
      iconName: "security",
    });
    setLoad(true);
    if (!stats()) {
      getStats().then(setStats);
    }
  });

  const show = useMatch(() => "/app/moderation");

  return (
    <Show when={load()}>
      <ModerationPage />
      <Show when={!show()}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--pane-color)",
            overflow: "auto",
            "justify-content": "center",
            display: "flex",
            margin: isMobileWidth() ? 0 : "8px 8px 8px 0",
            "border-radius": isMobileWidth() ? 0 : "8px",
            "padding-top": "40px",
            "z-index": "1111",
          }}
        >
          <Routes>
            <Route path="/servers/:serverId" element={<ServerPage />} />
            <Route path="/users/:userId" element={<UserPage />} />
          </Routes>
        </div>
      </Show>
    </Show>
  );
}

const SelectedUserActionsContainer = styled(FlexRow)`
  position: sticky;
  right: 0px;
  bottom: 10px;
  left: 0px;
  flex-shrink: 0;
  align-items: center;
  height: 50px;
  margin: 10px;
  margin-top: 5px;
  border-radius: 8px;
  backdrop-filter: blur(20px);
  background-color: rgba(0, 0, 0, 0.6);
  padding-left: 15px;
  padding-right: 10px;
  .suspendButton {
    margin-left: auto;
  }
`;

function SelectedUserActions() {
  const { createPortal } = useCustomPortal();

  const onSuspended = (suspension: ModerationSuspension) => {
    emitModerationUserSuspended(suspension);
    setSelectedUsers([]);
  };

  const showSuspendModal = () => {
    createPortal?.((close) => (
      <SuspendUsersModal
        close={close}
        users={selectedUsers()}
        done={onSuspended}
      />
    ));
  };
  return (
    <SelectedUserActionsContainer>
      <Text>{selectedUsers().length} User(s) Selected</Text>
      <Button
        class="suspendButton"
        onClick={showSuspendModal}
        label="Suspend Selected"
        primary
        color="var(--alert-color)"
      />
    </SelectedUserActionsContainer>
  );
}

function ModerationPage() {
  return (
    <>
      <ModerationPaneContainer class="moderation-pane-container">
        <StatsArea />
        <AuditLogPane />
        <TicketsPane />
        <UserColumn class="user-columns" gap={5}>
          <UsersPane />
          <OnlineUsersPane />
        </UserColumn>
        <ServersPane />
      </ModerationPaneContainer>
      <Show when={selectedUsers().length}>
        <SelectedUserActions />
      </Show>
    </>
  );
}

const TicketsPane = () => {
  const [hasWaiting, setHasWaiting] = createSignal(false);

  onMount(async () => {
    const tickets = await getTickets({
      limit: 1,
      status: TicketStatus.WAITING_FOR_MODERATOR_RESPONSE,
    });
    setHasWaiting(tickets.length > 0);
  });

  return (
    <div
      class={css`
        position: relative;
        margin-left: 10px;
        margin-right: 10px;
        margin-top: 4px;
      `}
    >
      <Show when={hasWaiting()}>
        <div class={css`position: absolute; top:10px; left: 6px;`}>
          <Icon name="error" color="var(--alert-color)" size={18}/>
        </div>
      </Show>
      <SettingsBlock
        icon="sell"
        description={
          <Show when={hasWaiting()}>
            <Text size={12} color="var(--warn-color)">There are ticket(s) waiting for moderator response.</Text>
          </Show>
        }
        label="Tickets"
      >
        <CustomLink href="./tickets">
          <Button tabIndex="-1" label="View Tickets" iconName="visibility" />
        </CustomLink>
      </SettingsBlock>
    </div>
  );
};

function UsersPane() {
  const LIMIT = 30;
  const [users, setUsers] = createSignal<RawUser[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);
  const [search, setSearch] = createSignal("");

  const [showAll, setShowAll] = createSignal(false);

  const moderationUserSuspendedListener = useModerationUserSuspendedListener();

  moderationUserSuspendedListener((suspension) => {
    setUsers(
      users().map((u) => {
        const wasSuspended = selectedUsers().find((su) => su.id === u.id);
        if (!wasSuspended) return u;
        return { ...u, suspension };
      })
    );
  });

  createEffect(
    on(afterId, async () => {
      if (search() && afterId()) {
        return fetchSearch();
      }
      fetchUsers();
    })
  );

  const onLoadMoreClick = () => {
    const user = users()[users().length - 1];
    setAfterId(user.id);
  };

  const firstFive = () => users().slice(0, 5);

  let timeout: number | null = null;
  const onSearchText = (text: string) => {
    setSearch(text);
    timeout && clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      setAfterId(undefined);
      setUsers([]);
      if (!search().trim()) {
        fetchUsers();
        return;
      }
      setShowAll(true);
      fetchSearch();
    }, 1000);
  };

  const fetchSearch = () => {
    setLoadMoreClicked(true);
    searchUsers(search(), LIMIT, afterId())
      .then((newUsers) => {
        setUsers([...users(), ...newUsers]);
        if (newUsers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  const fetchUsers = () => {
    setLoadMoreClicked(true);
    getUsers(LIMIT, afterId())
      .then((newUsers) => {
        setUsers([...users(), ...newUsers]);
        if (newUsers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  return (
    <UserPaneContainer class="pane users">
      <Input
        placeholder="Search"
        margin={[0, 0, 10, 30]}
        onText={onSearchText}
        value={search()}
      />
      <FlexRow gap={5} itemsCenter>
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>Registered Users</Text>
      </FlexRow>
      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : users()}>
          {(user) => <User user={user} />}
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

function OnlineUsersPane() {
  const [users, { mutate: setUsers }] =
    createResource<ModerationUser[]>(getOnlineUsers);

  const [showAll, setShowAll] = createSignal(false);

  const firstFive = () => users()?.slice(0, 5);

  const moderationUserSuspendedListener = useModerationUserSuspendedListener();

  moderationUserSuspendedListener((suspension) => {
    const localUsers = users();
    if (!localUsers) return;
    setUsers(
      localUsers.filter((u) => {
        return selectedUsers().find((su) => su.id !== u.id);
      })
    );
  });

  return (
    <UserPaneContainer class="pane users">
      <FlexRow gap={5} itemsCenter>
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>Online Users</Text>
      </FlexRow>
      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : users()}>
          {(user) => <User user={user} />}
        </For>
      </ListContainer>
    </UserPaneContainer>
  );
}

function ServersPane() {
  const LIMIT = 30;
  const [servers, setServers] = createSignal<RawServer[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);
  const [search, setSearch] = createSignal("");

  const [showAll, setShowAll] = createSignal(false);

  createEffect(
    on(afterId, async () => {
      if (search() && afterId()) {
        return fetchSearch();
      }
      fetchServers();
    })
  );

  const onLoadMoreClick = () => {
    const server = servers()[servers().length - 1];
    setAfterId(server.id);
  };

  const firstFive = () => servers().slice(0, 5);

  let timeout: number | null = null;
  const onSearchText = (text: string) => {
    setSearch(text);
    timeout && clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      setAfterId(undefined);
      setServers([]);
      if (!search().trim()) {
        fetchServers();
        return;
      }
      setShowAll(true);
      fetchSearch();
    }, 1000);
  };

  const fetchSearch = () => {
    setLoadMoreClicked(true);
    searchServers(search(), LIMIT, afterId())
      .then((newServers) => {
        setServers([...servers(), ...newServers]);
        if (newServers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  const fetchServers = () => {
    setLoadMoreClicked(true);
    getServers(LIMIT, afterId())
      .then((newServers) => {
        setServers([...servers(), ...newServers]);
        if (newServers.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  return (
    <PaneContainer class="pane servers">
      <Input
        placeholder="Search"
        margin={[0, 0, 10, 30]}
        onText={onSearchText}
        value={search()}
      />

      <FlexRow gap={5} itemsCenter>
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>Servers</Text>
      </FlexRow>

      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : servers()}>
          {(server) => <Server server={server} />}
        </For>
        <Show when={showAll() && !loadMoreClicked()}>
          <Button
            iconName="refresh"
            label="Load More"
            onClick={onLoadMoreClick}
          />
        </Show>
      </ListContainer>
    </PaneContainer>
  );
}

export function User(props: { user: any }) {
  const joined = formatTimestamp(props.user.joinedAt);
  const [hovered, setHovered] = createSignal(false);

  const selected = createMemo(() => isUserSelected(props.user.id));

  const onCheckChanged = () => {
    if (selected()) {
      setSelectedUsers(selectedUsers().filter((u) => u.id !== props.user.id));
      return;
    }
    setSelectedUsers([...selectedUsers(), props.user]);
  };

  const onLinkClick = (event: any) => {
    if (event.target.closest(".checkbox")) event.preventDefault();
  };

  return (
    <Link
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      href={`/app/moderation/users/${props.user.id}`}
      onclick={onLinkClick}
      class={itemStyles}
    >
      <Checkbox checked={selected()} onChange={onCheckChanged} />
      <CustomLink href={RouterEndpoints.PROFILE(props.user.id)}>
        <Avatar animate={hovered()} user={props.user} size={28} />
      </CustomLink>
      <ItemDetailContainer class="details">
        <FlexRow>
          <Text>{props.user.username}</Text>
          <Text opacity={0.6}>:{props.user.tag}</Text>
        </FlexRow>
        <FlexRow gap={3} itemsCenter>
          <Text size={12} opacity={0.6}>
            Registered:
          </Text>
          <Text size={12}>{joined}</Text>
          <Show when={props.user.suspension}>
            <Text
              size={12}
              style={{
                background: "var(--alert-color)",
                "border-radius": "4px",
                padding: "3px",
              }}
            >
              Suspended
            </Text>
          </Show>
        </FlexRow>
      </ItemDetailContainer>
    </Link>
  );
}

export function Server(props: { server: any }) {
  const created = formatTimestamp(props.server.createdAt);
  const createdBy = props.server.createdBy;
  const [hovered, setHovered] = createSignal(false);

  return (
    <Link
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      href={`/app/moderation/servers/${props.server.id}`}
      class={itemStyles}
    >
      <Avatar
        animate={hovered()}
        class={avatarStyle}
        server={props.server}
        size={28}
      />
      <ItemDetailContainer class="details">
        <Text>{props.server.name}</Text>
        <FlexRow gap={3}>
          <Text size={12} opacity={0.6}>
            Created:
          </Text>
          <Text size={12}>{created}</Text>
        </FlexRow>
        <FlexRow gap={3}>
          <Text size={12} opacity={0.6}>
            Created By:
          </Text>
          <Text size={12}>
            <Link
              class={linkStyle}
              href={`/app/moderation/users/${createdBy.id}`}
            >
              {createdBy.username}:{createdBy.tag}
            </Link>
          </Text>
        </FlexRow>
      </ItemDetailContainer>
    </Link>
  );
}

const StatCardContainer = styled(FlexColumn)`
  padding-left: 10px;
  padding-right: 10px;
  justify-content: center;
  height: 50px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

function StatCard(props: { title: string; description?: string }) {
  return (
    <StatCardContainer>
      <Text size={12} color="rgba(255,255,255,0.6)">
        {props.title}
      </Text>
      <Text size={12}>{props.description}</Text>
    </StatCardContainer>
  );
}

const StatsAreaContainer = styled(FlexRow)`
  margin-left: 10px;
  margin-right: 10px;
`;

function StatsArea() {
  return (
    <StatsAreaContainer gap={5} wrap>
      <StatCard
        title="Registered Users"
        description={stats()?.totalRegisteredUsers?.toLocaleString()}
      />
      <StatCard
        title="Messages"
        description={stats()?.totalCreatedMessages?.toLocaleString()}
      />
      <StatCard
        title="Servers"
        description={stats()?.totalCreatedServers?.toLocaleString()}
      />
      <StatCard
        title="Weekly Registered Users"
        description={stats()?.weeklyRegisteredUsers?.toLocaleString()}
      />
      <StatCard
        title="Weekly Messages"
        description={stats()?.weeklyCreatedMessages?.toLocaleString()}
      />
    </StatsAreaContainer>
  );
}

function AuditLogPane() {
  const LIMIT = 30;
  const [items, setItems] = createSignal<AuditLog[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);

  const [showAll, setShowAll] = createSignal(false);

  createEffect(
    on(afterId, async () => {
      fetchServers();
    })
  );

  const onLoadMoreClick = () => {
    const item = items()[items().length - 1];
    setAfterId(item.id);
  };
  const firstFive = () => items().slice(0, 5);

  const fetchServers = () => {
    setLoadMoreClicked(true);
    getAuditLog(LIMIT, afterId())
      .then((newItems) => {
        setItems([...items(), ...newItems]);
        if (newItems.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  return (
    <PaneContainer class="pane servers">
      <FlexRow gap={5} itemsCenter>
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>Audit Logs</Text>
      </FlexRow>

      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : items()}>
          {(item) => <AuditLogItem auditLog={item} />}
        </For>
        <Show when={showAll() && !loadMoreClicked()}>
          <Button
            iconName="refresh"
            label="Load More"
            onClick={onLoadMoreClick}
          />
        </Show>
      </ListContainer>
    </PaneContainer>
  );
}

function AuditLogItem(props: { auditLog: AuditLog }) {
  const created = formatTimestamp(props.auditLog.createdAt);
  const by = props.auditLog.actionBy;

  const expireAt = props.auditLog.expireAt
    ? formatTimestamp(props.auditLog.expireAt)
    : "Never";

  const [hovered, setHovered] = createSignal(false);

  const action = () => {
    switch (props.auditLog.actionType) {
      case AuditLogType.serverDelete:
        return {
          icon: "dnsremove_circle",
          color: "var(--alert-color)",
          title: "Server Deleted",
        };
      case AuditLogType.serverUpdate:
        return {
          icon: "dnsupdate",
          color: "var(--success-color)",
          title: "Server Updated",
        };
      case AuditLogType.userSuspend:
        return {
          icon: "personremove_circle",
          color: "var(--alert-color)",
          title: "User Suspended",
        };
      case AuditLogType.userUnsuspend:
        return {
          icon: "personlogin",
          color: "var(--success-color)",
          title: "User Un-suspended",
        };
      case AuditLogType.userUpdate:
        return {
          icon: "personupdate",
          color: "var(--success-color)",
          title: "User Updated",
        };
      default:
        return { icon: "texture", color: "gray", title: "Unknown Action" };
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      class={itemStyles}
    >
      <Avatar animate={hovered()} class={avatarStyle} user={by} size={28} />
      <ItemDetailContainer class="details">
        <FlexRow itemsCenter gap={4}>
          <Icon name={action().icon} color={action().color} size={18} />
          <Text>{action().title}</Text>
        </FlexRow>

        <FlexRow gap={3}>
          <Text size={12} opacity={0.6}>
            At{" "}
          </Text>
          <Text size={12}>{created}</Text>

          <Show when={props.auditLog.actionType === AuditLogType.userSuspend}>
            <Text size={12} opacity={0.6}>
              Suspended{" "}
            </Text>
            <Text size={12}>
              <Link
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </Link>
            </Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.userUpdate}>
            <Text size={12} opacity={0.6}>
              Updated{" "}
            </Text>
            <Text size={12}>
              <Link
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </Link>
            </Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.serverDelete}>
            <Text size={12} opacity={0.6}>
              Deleted{" "}
            </Text>
            <Text size={12}>{props.auditLog.serverName}</Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.serverUpdate}>
            <Text size={12} opacity={0.6}>
              Updated{" "}
            </Text>
            <Text size={12}>
              <Link
                class={linkStyle}
                href={`/app/moderation/servers/${props.auditLog.serverId}`}
              >
                {props.auditLog.serverName}
              </Link>
            </Text>
          </Show>

          <Text size={12} opacity={0.6}>
            By{" "}
          </Text>
          <Text size={12}>
            <Link class={linkStyle} href={`/app/moderation/users/${by.id}`}>
              {by.username}:{by.tag}
            </Link>
          </Text>
        </FlexRow>
        <Show when={props.auditLog.reason}>
          <FlexRow gap={3}>
            <Text size={12} opacity={0.6}>
              Reason:{" "}
            </Text>
            <Text size={12}>{props.auditLog.reason}</Text>
          </FlexRow>
        </Show>
        <Show when={props.auditLog.actionType === AuditLogType.userSuspend}>
          <FlexRow gap={3}>
            <Text size={12} opacity={0.6}>
              Expires{" "}
            </Text>
            <Text size={12}>{expireAt}</Text>
          </FlexRow>
        </Show>
      </ItemDetailContainer>
    </div>
  );
}
