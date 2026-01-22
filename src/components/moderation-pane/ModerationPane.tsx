import useStore from "@/chat-api/store/useStore";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  JSX,
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
  getModerationTickets,
  getUsers,
  ModerationStats,
  ModerationSuspension,
  ModerationUser,
  searchServers,
  searchUsers,
  getPosts,
  searchPosts,
  deletePosts,
  activeServers,
  getSuggestionActions,
  deleteSuggestActions,
  upsertSuggestActions,
} from "@/chat-api/services/ModerationService";
import Avatar from "../ui/Avatar";
import { formatTimestamp } from "@/common/date";
import { A, Outlet, useMatch, useSearchParams } from "solid-navigator";
import { RawPost, RawServer, RawUser, TicketStatus } from "@/chat-api/RawData";
import Button from "../ui/Button";
import { css, styled } from "solid-styled-components";
import Text from "../ui/Text";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Checkbox from "../ui/Checkbox";
import { toast, useCustomPortal } from "../ui/custom-portal/CustomPortal";
import SuspendUsersModal from "./SuspendUsersModal";
import { CustomLink } from "../ui/CustomLink";
import RouterEndpoints from "@/common/RouterEndpoints";
import Input from "../ui/input/Input";
import { useWindowProperties } from "@/common/useWindowProperties";
import Icon from "../ui/icon/Icon";

import {
  emitModerationServerDeleted,
  emitModerationUserSuspended,
  useModerationServerDeletedListener,
  useModerationUndoServerDeleteListener,
  useModerationUserSuspendedListener,
} from "@/common/GlobalEvents";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { classNames } from "@/common/classNames";
import DeletePostsModal from "./DeletePostsModal";
import AnnouncePostsModal from "./AnnouncePostsModal";
import DeleteAnnouncePostsModal from "./DeleteAnnouncePostsModal";
import DeleteServersModal from "./DeleteServersModal";
import { UsersPane } from "./UsersPane";
import { UsersAuditLogsPane } from "./UsersAuditLogsPane";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import { Modal } from "../ui/modal";
import { RadioBox } from "../ui/RadioBox";
import { selectedUsers, setSelectedUsers } from "./selectedUsers";
import { User, UserPaneContainer } from "./UserComponents";

const UserPage = lazy(() => import("./UserPage"));
const TicketsPage = lazy(() => import("@/components/tickets/TicketsPage"));
const ServerPage = lazy(() => import("./ServerPage"));

const [stats, setStats] = createSignal<ModerationStats | null>(null);

const [selectedServers, setSelectedServers] = createSignal<any[]>([]);
const [onlineUsersCount, setOnlineUsersCount] = createSignal<
  number | undefined
>();

const isServerSelected = (id: string) =>
  selectedServers().find((s) => s.id === id);
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

const PaneContainer = styled("div")<{ expanded: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;

  ${(props) =>
    props.expanded
      ? "resize: vertical; height: 500px;"
      : "  max-height: 500px;"}

  flex-shrink: 0;
  margin: 5px;
  margin-left: 10px;
  margin-right: 10px;
  min-height: 80px;
`;

const ListContainer = styled("div")`
  display: flex;
  flex-direction: column;

  margin-top: 10px;
  overflow: auto;
`;

const itemStyles = css`
  display: flex;
  flex-shrink: 0;
  gap: 5px;
  padding: 5px;
  padding-left: 16px;
  cursor: pointer;
  transition: 0.2s;
  text-decoration: none;
  color: white;

  border-top: solid 1px rgba(0, 0, 0, 0.4);
  padding-top: 10px;
  padding-bottom: 10px;

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
  margin-left: 6px;
`;

const PageContainer = styled(FlexColumn)`
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
  margin-top: 10px;
`;

export default function ModerationPane() {
  const { account, header } = useStore();
  const [load, setLoad] = createSignal(false);
  const { isMobileWidth } = useWindowProperties();

  createEffect(() => {
    if (!account.hasModeratorPerm(true)) return;
    header.updateHeader({
      title: "Moderation",
      iconName: "security",
    });
    setLoad(true);
    if (!stats()) {
      getStats().then(setStats);
    }
  });

  const isModerationRoute = useMatch(() => "/app/moderation");

  return (
    <Show when={load()}>
      <ModerationPage />
      <Show when={!isModerationRoute()}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--pane-color)",
            overflow: "auto",
            "justify-content": "center",
            display: "flex",
            "border-radius": isMobileWidth() ? 0 : "8px",
            "padding-top": "40px",
            "z-index": "1111",
          }}
        >
          <PageContainer>
            <Outlet name="moderationPane" />
          </PageContainer>
          {/* <Routes>
            <Route path="/servers/:serverId" element={<ServerPage />} />
            <Route path="/users/:userId" element={<UserPage />} />
            <Route path="/tickets" element={<PageContainer><TicketsPage/></PageContainer>} />
            <Route path="/tickets/:id" element={<PageContainer><TicketPage /></PageContainer>} />
          </Routes> */}
        </div>
      </Show>
    </Show>
  );
}

const SelectedUserActionsContainer = styled(FlexRow)`
  flex-shrink: 0;
  align-items: center;
  height: 50px;

  border-radius: 8px;
  backdrop-filter: blur(34px);
  background-color: rgba(0, 0, 0, 0.86);
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
function SelectedServerActions() {
  const { createPortal } = useCustomPortal();

  const onDeleted = () => {
    setSelectedServers([]);
  };

  const showDeleteModal = () => {
    createPortal?.((close) => (
      <DeleteServersModal
        close={close}
        servers={selectedServers()}
        done={onDeleted}
      />
    ));
  };
  return (
    <SelectedUserActionsContainer>
      <Text>{selectedServers().length} Server(s) Selected</Text>
      <Button
        class="suspendButton"
        onClick={showDeleteModal}
        label="Delete Selected"
        primary
        color="var(--alert-color)"
      />
    </SelectedUserActionsContainer>
  );
}

const SelectedActionsContainer = styled.div`
  position: sticky;
  right: 0px;
  bottom: 10px;
  left: 0px;
  margin: 10px;
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

function ModerationPage() {
  const store = useStore();
  const modOnlyBadge = store.account?.hasOnlyModBadge();

  return (
    <>
      <ModerationPaneContainer class="moderation-pane-container">
        <StatsArea />
        <SuggestedActionsPane />
        <Show when={!modOnlyBadge}>
          <AuditLogPane />
          <TicketsPane />
          <UserColumn class="user-columns" gap={5}>
            <UsersPane />
            <OnlineUsersPane />
          </UserColumn>
        </Show>
        <ServersPane />
        <ActiveServersPane />
        <PostsPane />
        <UsersAuditLogsPane />
      </ModerationPaneContainer>
      <Show when={selectedServers().length || selectedUsers().length}>
        <SelectedActionsContainer>
          <Show when={selectedServers().length}>
            <SelectedServerActions />
          </Show>
          <Show when={selectedUsers().length}>
            <SelectedUserActions />
          </Show>
        </SelectedActionsContainer>
      </Show>
    </>
  );
}

const TicketsPane = () => {
  const { tickets } = useStore();
  onMount(async () => {
    tickets.updateModerationTicketNotification();
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
      <Show when={tickets.hasModerationTicketNotification()}>
        <div
          class={css`
            position: absolute;
            top: 10px;
            left: 6px;
          `}
        >
          <Icon name="error" color="var(--alert-color)" size={18} />
        </div>
      </Show>
      <SettingsBlock
        icon="sell"
        description={
          <Show when={tickets.hasModerationTicketNotification()}>
            <Text size={12} color="var(--warn-color)">
              There are ticket(s) waiting for moderator response.
            </Text>
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

function OnlineUsersPane() {
  const [users, { mutate: setUsers }] =
    createResource<ModerationUser[]>(getOnlineUsers);

  createEffect(() => {
    setOnlineUsersCount(users()?.length || undefined);
  });

  const [showAll, setShowAll] = createSignal(false);

  const firstFive = () => users()?.slice(0, 5);

  const moderationUserSuspendedListener = useModerationUserSuspendedListener();

  moderationUserSuspendedListener((suspension) => {
    const localUsers = users();
    if (!localUsers) return;
    setUsers(
      localUsers.filter((u) => {
        return selectedUsers().find((su) => su.id !== u.id);
      }),
    );
  });

  return (
    <UserPaneContainer
      class="pane users"
      expanded={showAll()}
      style={!showAll() ? { height: "initial" } : undefined}
    >
      <FlexRow
        gap={5}
        itemsCenter
        style={{ "padding-left": "10px", "padding-top": "10px" }}
      >
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>Online Users ({users()?.length})</Text>
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

  const moderationServerDeletedListener = useModerationServerDeletedListener();
  const moderationUndoServerDeleteListener =
    useModerationUndoServerDeleteListener();

  moderationServerDeletedListener((deletedServers) => {
    setServers(
      servers().map((u) => {
        const wasSuspended = deletedServers.find((su) => su.id === u.id);
        if (!wasSuspended) return u;
        return { ...u, scheduledForDeletion: { scheduledAt: Date.now() } };
      }),
    );
  });

  moderationUndoServerDeleteListener((serverId) => {
    setServers(
      servers().map((u) => {
        if (u.id !== serverId) return u;
        return { ...u, scheduledForDeletion: undefined };
      }),
    );
  });

  createEffect(
    on(afterId, async () => {
      if (search() && afterId()) {
        return fetchSearch();
      }
      fetchServers();
    }),
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
    <PaneContainer
      class="pane servers"
      expanded={showAll()}
      style={!showAll() ? { height: "initial" } : undefined}
    >
      <Input
        placeholder="Search"
        margin={[10, 10, 10, 30]}
        onText={onSearchText}
        value={search()}
      />

      <FlexRow gap={5} itemsCenter style={{ "padding-left": "10px" }}>
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

function ActiveServersPane() {
  const [servers, setServers] = createSignal<RawServer[]>([]);

  const [showAll, setShowAll] = createSignal(false);

  const moderationServerDeletedListener = useModerationServerDeletedListener();
  const moderationUndoServerDeleteListener =
    useModerationUndoServerDeleteListener();

  moderationServerDeletedListener((deletedServers) => {
    setServers(
      servers().map((u) => {
        const wasSuspended = deletedServers.find((su) => su.id === u.id);
        if (!wasSuspended) return u;
        return { ...u, scheduledForDeletion: { scheduledAt: Date.now() } };
      }),
    );
  });

  moderationUndoServerDeleteListener((serverId) => {
    setServers(
      servers().map((u) => {
        if (u.id !== serverId) return u;
        return { ...u, scheduledForDeletion: undefined };
      }),
    );
  });

  createEffect(() => {
    fetchServers();
  });

  const firstFive = () => servers().slice(0, 5);

  const fetchServers = () => {
    activeServers().then((newServers) => {
      setServers([...newServers]);
    });
  };

  return (
    <PaneContainer
      class="pane servers"
      expanded={showAll()}
      style={!showAll() ? { height: "initial" } : undefined}
    >
      <FlexRow
        gap={5}
        itemsCenter
        style={{ "padding-left": "10px", "margin-top": "10px" }}
      >
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>7 day Active Servers</Text>
      </FlexRow>

      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : servers()}>
          {(server) => <Server server={server} />}
        </For>
      </ListContainer>
    </PaneContainer>
  );
}
function SuggestedActionsPane() {
  const LIMIT = 30;
  const [suggestions, setSuggestions] = createSignal<any[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);
  const { createPortal } = useCustomPortal();

  const [showAll, setShowAll] = createSignal(false);
  const store = useStore();

  createEffect(
    on(afterId, async () => {
      fetchUsers();
    }),
  );

  const onLoadMoreClick = () => {
    const suggestion = suggestions()[suggestions().length - 1];
    setAfterId(suggestion?.id);
  };

  const firstFive = () => suggestions().slice(0, 5);

  const fetchUsers = () => {
    setLoadMoreClicked(true);

    getSuggestionActions({
      limit: LIMIT,
      afterId: afterId(),
    })
      .then((result) => {
        if (result.data.length >= LIMIT) setLoadMoreClicked(false);
        setSuggestions([...suggestions(), ...result.data]);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  const suggested = (suggested: any) => {
    switch (suggested.actionType) {
      case AuditLogType.serverDelete:
        return "Delete Server";
      case AuditLogType.postDelete:
        return "Delete Post";
    }
  };

  return (
    <UserPaneContainer
      class="pane users"
      expanded={showAll()}
      style={{
        ...(!showAll() ? { height: "initial" } : undefined),
      }}
    >
      <div style={{ height: "10px" }} />
      <FlexRow
        gap={5}
        itemsCenter
        style={{
          "padding-left": "10px",
          "padding-top": "0px",
          "flex-shrink": "0",
        }}
      >
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>Suggestions</Text>
      </FlexRow>
      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : suggestions()}>
          {(suggest) => (
            <FlexRow
              itemsCenter
              gap={8}
              class={css`
                padding: 4px;
                padding-left: 18px;
              `}
            >
              <Avatar user={suggest.suggestBy} size={28} />
              <div
                class={css`
                  flex: 1;
                `}
              >
                <Text size={14}>
                  <A
                    class={linkStyle}
                    href={`/app/moderation/users/${suggest.suggestBy.id}`}
                  >
                    {suggest.suggestBy.username}:{suggest.suggestBy.tag}{" "}
                  </A>
                </Text>
                <Text size={14}>
                  Suggested to <strong>{suggested(suggest)}</strong>{" "}
                </Text>
                <Text size={14}>
                  <A
                    class={linkStyle}
                    href={`/app/moderation/servers/${suggest.server?.id}`}
                  >
                    {suggest.server?.name}{" "}
                  </A>
                </Text>
                <Show when={suggest.actionType === AuditLogType.postDelete}>
                  <Text size={14}>
                    Made By
                    <A
                      class={linkStyle}
                      href={`/app/moderation/users/${suggest.post.createdBy.id}`}
                    >
                      {" "}
                      {suggest.post.createdBy.username}
                    </A>
                  </Text>
                </Show>
                <div>
                  <span>
                    <Text size={12}>Reason: </Text>
                    <Text size={12} opacity={0.6}>
                      <strong>{suggest.reason}</strong>{" "}
                    </Text>
                  </span>
                </div>
              </div>
              <FlexRow gap={4}>
                <Show
                  when={
                    store.account.hasModeratorPerm() &&
                    suggest.actionType === AuditLogType.serverDelete
                  }
                >
                  <Button
                    label="Delete Server"
                    textSize={12}
                    alert
                    onClick={() => {
                      createPortal((close) => (
                        <DeleteServersModal
                          close={close}
                          servers={[{ id: suggest.server.id }]}
                          done={() => {
                            deleteSuggestActions(suggest.id).then(() => {
                              setSuggestions(
                                suggestions().filter(
                                  (s) => s.id !== suggest.id,
                                ),
                              );
                            });
                          }}
                        />
                      ));
                    }}
                    margin={0}
                  />
                </Show>
                <Show
                  when={
                    store.account.hasModeratorPerm() &&
                    suggest.actionType === AuditLogType.postDelete
                  }
                >
                  <Button
                    label="Delete Post"
                    textSize={12}
                    alert
                    onClick={() => {
                      createPortal((close) => (
                        <DeletePostsModal
                          close={close}
                          postIds={[suggest.post.id]}
                          done={() => {
                            deleteSuggestActions(suggest.id).then(() => {
                              setSuggestions(
                                suggestions().filter(
                                  (s) => s.id !== suggest.id,
                                ),
                              );
                            });
                          }}
                        />
                      ));
                    }}
                    margin={0}
                  />
                </Show>
                <Show when={suggest.actionType === AuditLogType.postDelete}>
                  <Button
                    iconName="visibility"
                    iconSize={18}
                    href={"?postId=" + suggest.post.id}
                    margin={0}
                  />
                </Show>
                <Button
                  iconName="close"
                  margin={0}
                  iconSize={18}
                  alert
                  onClick={() => {
                    deleteSuggestActions(suggest.id).then(() => {
                      setSuggestions(
                        suggestions().filter((s) => s.id !== suggest.id),
                      );
                    });
                  }}
                />
              </FlexRow>
            </FlexRow>
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
export function Server(props: {
  server: RawServer & { messageCount?: number; userMessageCount?: number };
}) {
  const created = formatTimestamp(props.server.createdAt);
  const createdBy = props.server.createdBy;
  const [hovered, setHovered] = createSignal(false);

  const onClick = (e: MouseEvent) => {
    if (e.target instanceof Element) {
      if (e.target.closest(".checkbox")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  const selected = createMemo(() => isServerSelected(props.server.id));

  const onCheckChanged = () => {
    if (selected()) {
      setSelectedServers(
        selectedServers().filter((u) => u.id !== props.server.id),
      );
      return;
    }
    setSelectedServers([...selectedServers(), props.server]);
  };

  return (
    <A
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      href={`/app/moderation/servers/${props.server.id}`}
      class={itemStyles}
    >
      <Checkbox
        onChange={onCheckChanged}
        checked={selected()}
        disabled={!!props.server.scheduledForDeletion}
        class={css`
          place-self: start;
          margin-top: 6px;
        `}
      />
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
            <A class={linkStyle} href={`/app/moderation/users/${createdBy.id}`}>
              {createdBy.username}:{createdBy.tag}
            </A>
          </Text>
        </FlexRow>
        <Show when={props.server.messageCount}>
          <FlexRow gap={3}>
            <Text size={12} opacity={0.6}>
              Messages:
            </Text>
            <Text size={12}>{props.server.messageCount?.toLocaleString()}</Text>
            <Text size={12} opacity={0.6}>
              User Messages:
            </Text>
            <Text size={12}>
              {props.server.userMessageCount?.toLocaleString()}
            </Text>
          </FlexRow>
        </Show>
        <FlexRow gap={2} wrap>
          <Show when={props.server.scheduledForDeletion}>
            <div
              style={{
                background: "var(--alert-color)",
                "border-radius": "4px",
                padding: "2px 8px",
                "margin-top": "4px",
                display: "inline-block",
              }}
            >
              <Text size={12}>Scheduled Deletion</Text>
            </div>
          </Show>
          <Show when={props.server.publicServer}>
            <div
              style={{
                background: "var(--primary-color)",
                "border-radius": "4px",
                padding: "2px 8px",
                "margin-top": "4px",
                display: "inline-block",
              }}
            >
              <Icon name="public" size={13} />
            </div>
          </Show>
        </FlexRow>
      </ItemDetailContainer>
    </A>
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
  const store = useStore();
  return (
    <StatsAreaContainer gap={5} wrap>
      <StatCard
        title="Registered Users"
        description={stats()?.totalRegisteredUsers?.toLocaleString()}
      />
      <Show when={!store.account.hasOnlyModBadge()}>
        <StatCard
          title="Online Users"
          description={onlineUsersCount()?.toLocaleString()}
        />
      </Show>
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

export function AuditLogPane(props: {
  search: string;
  style?: JSX.CSSProperties;
}) {
  const LIMIT = 30;
  const [items, setItems] = createSignal<AuditLog[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);

  const [showAll, setShowAll] = createSignal(false);

  createEffect(
    on(afterId, async () => {
      fetchLogs();
    }),
  );

  const onLoadMoreClick = () => {
    const item = items()[items().length - 1];
    setAfterId(item.id);
  };
  const firstFive = () => items().slice(0, 5);

  const fetchLogs = () => {
    setLoadMoreClicked(true);
    getAuditLog({
      limit: LIMIT,
      afterId: afterId(),
      search: props.search,
    })
      .then((newItems) => {
        setItems([...items(), ...newItems]);
        if (newItems.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  return (
    <PaneContainer
      class="pane servers"
      expanded={showAll()}
      style={{
        ...(!showAll() ? { height: "initial" } : undefined),
        ...props.style,
      }}
    >
      <FlexRow
        gap={5}
        itemsCenter
        style={{ "padding-left": "10px", "padding-top": "10px" }}
      >
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
  const [expanded, setExpanded] = createSignal(false);
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
          icon: "dns",
          color: "var(--alert-color)",
          title: "Server Delete",
        };
      case AuditLogType.serverUpdate:
        return {
          icon: "dns",
          color: "var(--success-color)",
          title: "Server Update",
        };
      case AuditLogType.userSuspend:
        return {
          icon: "person",
          color: "var(--alert-color)",
          title: "User Suspend",
        };
      case AuditLogType.userUnsuspend:
        return {
          icon: "person",
          color: "var(--success-color)",
          title: "User Unsuspend",
        };
      case AuditLogType.userUpdate:
        return {
          icon: "person",
          color: "var(--success-color)",
          title: "User Update",
        };
      default:
        return { icon: "texture", color: "gray", title: "Unknown Action" };
    }
  };

  const isExpandable = () => {
    switch (props.auditLog.actionType) {
      case AuditLogType.userSuspend:
        return true;
      case AuditLogType.userWarned:
        return true;

      case AuditLogType.serverDelete:
        return true;

      case AuditLogType.userShadowBanned:
        return true;

      default:
        return false;
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      class={itemStyles}
      style={{ cursor: "initial", overflow: "hidden" }}
    >
      <Avatar animate={hovered()} class={avatarStyle} user={by} size={28} />
      <ItemDetailContainer class="details">
        <FlexRow gap={3} itemsCenter style={{ "margin-bottom": "2px" }}>
          <Show when={props.auditLog.actionType === AuditLogType.ipBan}>
            <Text size={14}>
              {props.auditLog.count || 1} IP(s) Banned for 7 days
            </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>
          <Show when={props.auditLog.actionType === AuditLogType.userWarned}>
            <Text size={14}>Warned </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>
          <Show
            when={props.auditLog.actionType === AuditLogType.userShadowUnbanned}
          >
            <Text size={14}>Undo Shadow Banned </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>
          <Show
            when={props.auditLog.actionType === AuditLogType.userShadowBanned}
          >
            <Text size={14}>Shadow Banned </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>
          <Show when={props.auditLog.actionType === AuditLogType.userSuspend}>
            <Text size={14}>Suspend </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>

          <Show
            when={props.auditLog.actionType === AuditLogType.userSuspendUpdate}
          >
            <Text size={14}>Updated Suspension for </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.postDelete}>
            <Text size={14}>Post From </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
            <Text size={14}>Was Deleted </Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.userUnsuspend}>
            <Text size={14}>Unsuspend </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.userUpdate}>
            <Text size={14}>Updated </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.auditLog.userId}`}
              >
                {props.auditLog.username}
              </A>
            </Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.serverDelete}>
            <Text size={14}>Deleted </Text>
            <Text size={14}>{props.auditLog.serverName}</Text>
          </Show>
          <Show
            when={props.auditLog.actionType === AuditLogType.serverUndoDelete}
          >
            <Text size={14}>Undo Delete </Text>
            <Text size={14}>{props.auditLog.serverName}</Text>
          </Show>

          <Show when={props.auditLog.actionType === AuditLogType.serverUpdate}>
            <Text size={14}>Updated </Text>
            <Text size={14}>
              <A
                class={linkStyle}
                href={`/app/moderation/servers/${props.auditLog.serverId}`}
              >
                {props.auditLog.serverName}
              </A>
            </Text>
          </Show>

          <Text size={14}>By </Text>
          <Text size={14}>
            <A class={linkStyle} href={`/app/moderation/users/${by.id}`}>
              {by.username}:{by.tag}
            </A>
          </Text>
        </FlexRow>

        <FlexRow gap={3}>
          <Text size={12} opacity={0.6}>
            At:{" "}
          </Text>
          <Text size={12}>{created}</Text>
        </FlexRow>

        <Show when={expanded()}>
          <Show when={props.auditLog.reason}>
            <FlexRow gap={3}>
              <Text size={12} opacity={0.6}>
                Reason:{" "}
              </Text>
              <Text size={12} style={{ "white-space": "initial" }}>
                {props.auditLog.reason}
              </Text>
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
        </Show>
      </ItemDetailContainer>
      <Show when={isExpandable()}>
        <Button
          padding={4}
          margin={[0, 6, 0, 0]}
          styles={{ "margin-left": "auto", "align-self": "start" }}
          iconName="arrow_drop_down"
          onClick={() => setExpanded(!expanded())}
        />
      </Show>
    </div>
  );
}

function PostsPane() {
  const LIMIT = 30;
  const [posts, setPosts] = createSignal<RawPost[]>([]);
  const [afterId, setAfterId] = createSignal<string | undefined>(undefined);
  const [loadMoreClicked, setLoadMoreClicked] = createSignal(false);
  const [search, setSearch] = createSignal("");
  let pageContainerEl: HTMLDivElement | undefined;

  const [searchParams, setSearchParams] = useSearchParams<{
    "search-post-id": string;
  }>();

  onMount(() => {
    if (searchParams["search-post-id"]) {
      setSearch(searchParams["search-post-id"]);
      setSearchParams({ "search-post-id": undefined! }, { replace: true });
      const el = document.querySelector(".main-pane-container")!;

      setTimeout(() => {
        el.scrollTo(0, el.scrollHeight);
      }, 100);
    }
  });

  const [showAll, setShowAll] = createSignal(false);

  createEffect(
    on(afterId, async () => {
      if (search() && afterId()) {
        return fetchSearch();
      }
      if (search()) {
        return fetchSearch();
      }
      fetchPosts();
    }),
  );

  const onLoadMoreClick = () => {
    const post = posts()[posts().length - 1];
    setAfterId(post?.id);
  };

  const firstFive = () => posts().slice(0, 5);

  let timeout: number | null = null;
  const onSearchText = (text: string) => {
    setSearch(text);
    timeout && clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      setAfterId(undefined);
      setPosts([]);
      if (!search().trim()) {
        fetchPosts();
        return;
      }
      setShowAll(true);
      fetchSearch();
    }, 1000);
  };

  const fetchSearch = () => {
    setLoadMoreClicked(true);
    searchPosts(search(), LIMIT, afterId())
      .then((newPosts) => {
        setPosts([...posts(), ...newPosts.toReversed()]);
        if (newPosts.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  const fetchPosts = () => {
    setLoadMoreClicked(true);
    getPosts(LIMIT, afterId())
      .then((newPosts) => {
        setPosts([...posts(), ...newPosts.toReversed()]);
        if (newPosts.length >= LIMIT) setLoadMoreClicked(false);
      })
      .catch(() => setLoadMoreClicked(false));
  };

  const onDelete = (postId: string) => {
    setPosts(posts().filter((post) => post.id !== postId));
  };
  const onAnnouncementAdd = (postId: string) => {
    setPosts(
      posts().map((post) => {
        if (post.id !== postId) return post;
        return { ...post, announcement: true };
      }),
    );
  };
  const onAnnouncementRemove = (postId: string) => {
    setPosts(
      posts().map((post) => {
        if (post.id !== postId) return post;
        return { ...post, announcement: false };
      }),
    );
  };

  return (
    <PaneContainer
      class="pane posts"
      ref={pageContainerEl}
      expanded={showAll()}
      style={!showAll() ? { height: "initial" } : undefined}
    >
      <Input
        placeholder="Search by post id / user id"
        margin={[10, 10, 10, 30]}
        onText={onSearchText}
        value={search()}
      />

      <FlexRow gap={5} itemsCenter style={{ "padding-left": "10px" }}>
        <Button
          iconName="add"
          iconSize={14}
          padding={4}
          onClick={() => setShowAll(!showAll())}
        />
        <Text>Posts</Text>
      </FlexRow>

      <ListContainer class="list">
        <For each={!showAll() ? firstFive() : posts()}>
          {(post) => (
            <Post
              post={post}
              onDelete={onDelete}
              onAnnouncementAdd={onAnnouncementAdd}
              onAnnouncementRemove={onAnnouncementRemove}
            />
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
    </PaneContainer>
  );
}

export function Post(props: {
  post: RawPost;
  onDelete?: (postId: string) => void;
  onAnnouncementAdd?: (postId: string) => void;
  onAnnouncementRemove?: (postId: string) => void;
}) {
  const store = useStore();
  const created = formatTimestamp(props.post.createdAt);
  const createdBy = props.post.createdBy;
  const [hovered, setHovered] = createSignal(false);
  const [searchParams, setSearchParams] = useSearchParams<{
    postId?: string;
  }>();
  const { createPortal } = useCustomPortal();

  const onPostDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    createPortal((close) => (
      <DeletePostsModal
        close={close}
        postIds={[props.post.id]}
        done={() => props.onDelete?.(props.post.id)}
      />
    ));
  };
  const onPostAnnounceClick = (e: MouseEvent) => {
    e.stopPropagation();
    createPortal((close) => (
      <AnnouncePostsModal
        close={close}
        postId={props.post.id}
        done={() => props.onAnnouncementAdd?.(props.post.id)}
      />
    ));
  };
  const onRemoveAnnounceClick = (e: MouseEvent) => {
    e.stopPropagation();
    createPortal((close) => (
      <DeleteAnnouncePostsModal
        close={close}
        postId={props.post.id}
        done={() => props.onAnnouncementRemove?.(props.post.id)}
      />
    ));
  };

  const showSuggestModal = (e: MouseEvent) => {
    e.stopPropagation();

    const [selectedOption, setSelectedOption] = createSignal("");
    const [reason, setReason] = createSignal("");
    const [requestSent, setRequestSent] = createSignal(false);
    createPortal((close) => {
      const onSuggestClick = async () => {
        if (!selectedOption()) {
          return toast("Please select a reason");
        }
        if (requestSent()) return;
        setRequestSent(true);
        await upsertSuggestActions({
          actionType: AuditLogType.postDelete,
          postId: props.post.id,

          reason: selectedOption() === "Other" ? reason() : selectedOption(),
        })
          .then(() => {
            close();
          })
          .catch((err) => toast(err.message || err.error))
          .finally(() => setRequestSent(false));
      };
      return (
        <Modal.Root close={close} doNotCloseOnBackgroundClick>
          <Modal.Header title="Suggest" />
          <Modal.Body>
            <FlexColumn gap={4}>
              <RadioBox
                items={[
                  { id: "NSFW", label: "NSFW" },
                  { id: "Racist", label: "Racist" },
                  { id: "Hateful", label: "Hateful" },
                  { id: "Other", label: "Other" },
                ]}
                initialId={selectedOption()}
                onChange={(item) => setSelectedOption(item.id)}
              />
              <Show when={selectedOption() === "Other"}>
                <Input
                  placeholder="Reason"
                  onText={setReason}
                  value={reason()}
                />
              </Show>
            </FlexColumn>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Button
              label="Suggest"
              iconName="check"
              onClick={onSuggestClick}
              primary
            />
          </Modal.Footer>
        </Modal.Root>
      );
    });
  };

  return (
    <div
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onClick={(e) => {
        if (e.target.closest("." + linkStyle)) return;
        setSearchParams({ postId: props.post.id });
      }}
      class={itemStyles}
    >
      <Avatar
        animate={hovered()}
        class={avatarStyle}
        user={createdBy}
        size={28}
      />
      <ItemDetailContainer class="details">
        <Show when={props.post.attachments?.length}>
          <Icon
            style={{ "vertical-align": "-2px", "margin-right": "4px" }}
            size={14}
            name="image"
            color="rgba(255,255,255,0.6)"
          />
        </Show>
        <Text size={14}>{props.post.content}</Text>
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
            <A class={linkStyle} href={`/app/moderation/users/${createdBy.id}`}>
              {createdBy.username}:{createdBy.tag}
            </A>
          </Text>
        </FlexRow>

        <Show when={props.post.commentTo}>
          <FlexRow gap={3}>
            <Text size={12} opacity={0.6}>
              Replying To:
            </Text>
            <Text size={12}>
              <A
                class={linkStyle}
                href={`/app/moderation/users/${props.post.commentTo?.createdBy.id}`}
              >
                {props.post.commentTo?.createdBy.username}:
                {props.post.commentTo?.createdBy.tag}
              </A>
            </Text>
          </FlexRow>
        </Show>
      </ItemDetailContainer>

      <FlexColumn style={{ "margin-left": "auto" }} gap={4}>
        <Show when={!store.account.hasOnlyModBadge()}>
          <Show when={props.post.announcement}>
            <Button
              onClick={onRemoveAnnounceClick}
              iconName="horizontal_rule"
              label="Remove Announce"
              textSize={12}
              iconSize={16}
              margin={0}
              padding={4}
              color="var(--alert-color)"
            />
          </Show>
          <Show when={!props.post.announcement}>
            <Button
              onClick={onPostAnnounceClick}
              iconName="add"
              label="Announce"
              textSize={12}
              iconSize={16}
              margin={0}
              padding={4}
            />
          </Show>
          <Button
            onClick={onPostDeleteClick}
            iconName="delete"
            label="Delete"
            textSize={12}
            iconSize={16}
            color="var(--alert-color)"
            margin={0}
            padding={4}
          />
        </Show>
        <Button
          onClick={showSuggestModal}
          iconName="delete"
          label="Suggest Delete"
          textSize={12}
          iconSize={16}
          color="var(--alert-color)"
          margin={0}
          padding={4}
        />
      </FlexColumn>
    </div>
  );
}
