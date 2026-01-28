import styles from "./styles.module.scss";
import Avatar from "@/components/ui/Avatar";
import UserPresence from "@/components/user-presence/UserPresence";
import { useNavigate, useParams } from "solid-navigator";
import useStore from "@/chat-api/store/useStore";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  lazy,
  mapArray,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import MemberContextMenu from "../member-context-menu/MemberContextMenu";
import { DrawerHeader } from "@/components/drawer-header/DrawerHeader";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { css } from "solid-styled-components";
import { bannerUrl } from "@/chat-api/store/useUsers";
import Text from "@/components/ui/Text";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import {
  fetchChannelAttachments,
  searchMessages,
} from "@/chat-api/services/MessageService";
import { ChannelType, RawAttachment, RawMessage } from "@/chat-api/RawData";
import env from "@/common/env";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import socketClient from "@/chat-api/socketClient";
import { ServerEvents } from "@/chat-api/EventNames";
import { emitScrollToMessage } from "@/common/GlobalEvents";
import { Skeleton } from "../ui/skeleton/Skeleton";

const ProfileFlyout = lazy(() => import("../floating-profile/FloatingProfile"));
import { Delay } from "@/common/Delay";
import { getCachedNotice } from "@/common/useChannelNotice";
import { Emoji } from "../ui/Emoji";
import { Markup } from "../Markup";
import { t } from "@nerimity/i18lite";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { Tooltip } from "../ui/Tooltip";
import { userDetailsPreloader } from "@/common/createPreloader";
import Input from "../ui/input/Input";
import MessageItem from "../message-pane/message-item/MessageItem";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useResizeObserver } from "@/common/useResizeObserver";
import { FlexRow } from "../ui/Flexbox";
import { Item } from "../ui/Item";
import { VirtualList } from "../ui/VirtualList";
import { Fonts, getFont } from "@/common/fonts";
import { Channel } from "@/chat-api/store/useChannels";
import { matchSorter } from "match-sorter";

const MemberItem = (props: {
  member: ServerMember;
  style: JSX.CSSProperties;
}) => {
  const params = useParams<{ serverId: string }>();
  const user = () => props.member.user();
  let elementRef: undefined | HTMLDivElement;
  const [contextPosition, setContextPosition] = createSignal<
    { x: number; y: number } | undefined
  >(undefined);
  const [hovering, setHovering] = createSignal(false);
  const { createRegisteredPortal, isPortalOpened } = useCustomPortal();

  const isProfileFlyoutOpened = () => {
    return isPortalOpened("profile-pane-flyout-" + user().id);
  };

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const isAdmin = () => {
    return props.member.hasPermission(ROLE_PERMISSIONS.ADMIN, false, true);
  };
  const isCreator = () => {
    return props.member.isServerCreator();
  };

  const onClick = (e: MouseEvent) => {
    const rect = elementRef?.getBoundingClientRect()!;

    createRegisteredPortal(
      "ProfileFlyout",
      {
        triggerEl: e.currentTarget as HTMLElement,
        position: { left: rect.left, top: rect.top },
        serverId: params.serverId,
        close: close,
        userId: user().id,
      },
      "profile-pane-flyout-" + user().id,
      true,
    );
  };

  const topRoleWithColor = createMemo(() => props.member.topRoleWithColor());

  const font = createMemo(() =>
    getFont(props.member.user().profile?.font || 0),
  );

  return (
    <div
      style={props.style}
      onMouseEnter={() => {
        userDetailsPreloader.preload(user().id);
        setHovering(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      <MemberContextMenu
        position={contextPosition()}
        serverId={props.member.serverId}
        userId={props.member.userId}
        onClose={() => setContextPosition(undefined)}
      />
      <div
        onClick={onClick}
        ref={elementRef}
        class={cn(styles.memberItem, "trigger-profile-flyout")}
        onContextMenu={onContextMenu}
      >
        <Avatar
          resize={96}
          animate={hovering() || !!isProfileFlyoutOpened()}
          size={30}
          user={user()}
        />
        <div class={styles.memberInfo}>
          <div
            class={styles.username}
            style={{
              "--gradient":
                topRoleWithColor()?.gradient || topRoleWithColor()?.hexColor,
              "--color": topRoleWithColor()?.hexColor!,
              "--font": `'${font()?.name}'`,
              "--lh": font()?.lineHeight,
              "--ls": font()?.letterSpacing,
              "--scale": font()?.scale,
            }}
          >
            {props.member.nickname || user().username}
          </div>
          <UserPresence
            class={styles.userPresence}
            tooltipAnchor="left"
            animate={hovering() || !!isProfileFlyoutOpened()}
            userId={user().id}
            showOffline={false}
            hideAction
            useTitle
          />
        </div>
        <Show when={isAdmin() || isCreator()}>
          <Tooltip
            tooltip={
              isCreator()
                ? t("informationDrawer.creator")
                : t("informationDrawer.admin")
            }
            class={styles.adminOrCreatorBadge}
            anchor="left"
          >
            <Show when={isCreator()}>
              <img src="https://nerimity.com/twemojis/1f451.svg" />
            </Show>
            <Show when={!isCreator()}>
              <img src="https://nerimity.com/twemojis/1f6e1.svg" />
            </Show>
          </Tooltip>
        </Show>
      </div>
    </div>
  );
};

type Page = "info" | "attachments" | "search";

const selectedHeaderButtonStyle = css`
  position: relative;
  pointer-events: none;

  &:focus {
    && {
      background-color: transparent;
    }
  }

  border-color: transparent;
  &:before {
    position: absolute;
    content: "";
    inset: 0;
    opacity: 0.2;
    background-color: var(--primary-color);
    border-radius: 8px;
  }
`;

const Header = (props: {
  onChange: (Page: Page) => void;
  selectedPage: Page;
}) => {
  return (
    <DrawerHeader
      class={css`
        justify-content: center;
        gap: 4px;
      `}
    >
      <Button
        class={classNames(
          props.selectedPage === "info" && selectedHeaderButtonStyle,
        )}
        iconName="info"
        label={t("informationDrawer.info")}
        type="hover_border"
        onClick={() => props.onChange("info")}
        margin={0}
        iconSize={16}
      />
      <Button
        class={classNames(
          props.selectedPage === "attachments" && selectedHeaderButtonStyle,
        )}
        iconName="attach_file"
        type="hover_border"
        label={t("informationDrawer.files")}
        onClick={() => props.onChange("attachments")}
        margin={0}
        iconSize={16}
      />
      <Button
        class={classNames(
          props.selectedPage === "search" && selectedHeaderButtonStyle,
        )}
        iconName="search"
        label={t("general.searchPlaceholder")}
        type="hover_border"
        onClick={() => props.onChange("search")}
        margin={0}
        iconSize={16}
      />
    </DrawerHeader>
  );
};

const RightDrawer = () => {
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const [pages, setPage] = createSignal<Page>("info");
  const [hovered, setHovered] = createSignal(false);

  createEffect(
    on(
      () => params.channelId,
      () => {
        setPage("info");
      },
    ),
  );

  return (
    <>
      <Header onChange={setPage} selectedPage={pages()} />
      <div
        class={styles.drawerContainer}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Show when={pages() === "info"}>
          <MainDrawer
            hovered={hovered()}
            onShowAttachmentClick={() => setPage("attachments")}
          />
        </Show>
        <Show when={pages() === "attachments"}>
          <AttachmentDrawer />
        </Show>
        <Show when={pages() === "search"}>
          <SearchDrawer />
        </Show>
      </div>
    </>
  );
};

const AttachmentDrawer = () => {
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const { channels } = useStore();

  const [attachments, setAttachments] = createSignal<RawAttachment[] | null>(
    null,
  );
  const channel = () => channels.get(params.channelId);

  const incrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = channel?._count?.attachments || 0;
    channel?.update({ _count: { attachments: count + 1 } });
  };
  const decrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = channel?._count?.attachments || 1;
    channel?.update({ _count: { attachments: count - 1 } });
  };

  onMount(async () => {
    const newAttachments = await fetchChannelAttachments(params.channelId!);
    setAttachments(newAttachments);
  });

  const onMessage = (payload: { message: RawMessage }) => {
    if (!attachments()) return;
    if (payload.message.channelId !== params.channelId) return;
    const attachment = payload?.message.attachments?.[0];
    if (!attachment) return;
    setAttachments([
      { ...attachment, messageId: payload.message.id },
      ...attachments()!,
    ]);
    incrAttachments(params.channelId);
  };
  socketClient.useSocketOn(ServerEvents.MESSAGE_CREATED, onMessage);

  const onDelete = (payload: { messageId: string; channelId: string }) => {
    if (!attachments()) return;
    if (payload.channelId !== params.channelId) return;
    setAttachments(
      attachments()!.filter(
        (attachment) => attachment.messageId !== payload.messageId,
      ),
    );
    decrAttachments(params.channelId);
  };
  socketClient.useSocketOn(ServerEvents.MESSAGE_DELETED, onDelete);

  return (
    <>
      <div
        style={{
          "margin-left": "8px",
          "margin-top": "8px",
          display: "flex",
        }}
      >
        <Text size={14}>{t("informationDrawer.attachments")}</Text>
        <div class={styles.memberCount}>
          {channel()?._count?.attachments?.toLocaleString?.() ?? "..."}
        </div>
      </div>
      <div class={styles.attachmentList}>
        <Show when={!attachments()}>
          <For each={Array(50).fill(undefined)}>
            {() => (
              <Skeleton.Item width="100%" style={{ "aspect-ratio": "1/1" }} />
            )}
          </For>
        </Show>
        <Show when={attachments()}>
          <For each={attachments()}>
            {(item) => <AttachmentImage attachment={item} />}
          </For>
        </Show>
      </div>
    </>
  );
};

const AttachmentImage = (props: { attachment: RawAttachment }) => {
  const isFile = () =>
    !props.attachment.height && !props.attachment.mime?.endsWith("image");
  const isGif = () => props.attachment.path?.endsWith(".gif");

  const url = (ignoreFocus?: boolean) => {
    let url = `${env.NERIMITY_CDN}${props.attachment.path}`;
    if (ignoreFocus) return url;
    if (isGif()) return (url += "?type=webp");
    return url;
  };

  const onClicked = () => {
    if (!props.attachment.messageId) return;
    emitScrollToMessage({
      messageId: props.attachment.messageId,
    });
  };

  return (
    <div
      class={classNames(
        styles.attachmentImageContainer,
        conditionalClass(isGif(), styles.gif),
      )}
    >
      <div class={styles.attachmentHover} onClick={onClicked}>
        <Icon name="visibility" color="var(--primary-color)" />
      </div>

      <Show when={!isFile()}>
        <img class={styles.attachmentImage} loading="lazy" src={url()} />
      </Show>
      <Show when={isFile()}>
        <div class={styles.fileAttachment}>
          <Icon name="draft" color="var(--primary-color)" size={40} />
        </div>
      </Show>
    </div>
  );
};

const MainDrawer = (props: {
  onShowAttachmentClick(): void;
  hovered: boolean;
}) => {
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const { channels } = useStore();

  const channel = () => channels.get(params.channelId!);

  const cachedNotice = () =>
    params.channelId ? getCachedNotice(() => params.channelId!) : undefined;

  return (
    <>
      <Show when={channel()?.serverId}>
        <BannerItem hovered={props.hovered} />
      </Show>
      <Show when={channel()?.serverId}>
        <ServerChannelNotice />
      </Show>
      <Show when={channel()?.recipientId}>
        <ProfileFlyout
          channelNotice={cachedNotice()?.content}
          dmPane
          userId={channel()?.recipientId!}
        />
      </Show>
      {/* <Show when={channel()}>
        <Button
          label={t("informationDrawer.attachments")}
          customChildren={
            <>
              <div class={styles.attachmentCount}>
                {channel()?._count?.attachments?.toLocaleString?.() ?? "..."}
              </div>
              <Icon
                size={16}
                color="var(--primary-color)"
                name="keyboard_arrow_right"
              />
            </>
          }
          iconName="attach_file"
          iconSize={16}
          onClick={props.onShowAttachmentClick}
          class={css`
            justify-content: start;
          `}
          padding={5}
        />
      </Show> */}
      <Show when={params.serverId}>
        <ServerDrawer />
      </Show>
    </>
  );
};

const BannerItem = (props: { hovered: boolean }) => {
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const { servers, channels } = useStore();

  const server = () => servers.get(params.serverId!);

  const channel = () => channels.get(params.channelId!)?.recipient();

  const bannerData = () =>
    server() || (channel() as { hexColor: string; banner?: string });

  return (
    <Show when={bannerData()?.banner}>
      <Banner
        resize={400}
        class={css`
          margin-left: 5px;
          margin-right: 5px;
        `}
        margin={0}
        brightness={100}
        animate={props.hovered}
        hexColor={bannerData()?.hexColor}
        url={bannerUrl(bannerData()!)}
      />
    </Show>
  );
};

const ServerDrawer = () => {
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const { servers, serverRoles, channels } = useStore();
  const server = () => servers.get(params.serverId!);
  const channel = () => channels.get(params.channelId!);

  const roles = () => serverRoles.getAllByServerId(params.serverId!);

  const members = createMemo(() => channel()?.membersWithChannelAccess() || []);

  const roleMembers = mapArray(roles, (role) => {
    const membersInThisRole = () =>
      members().filter((member) => {
        if (!member?.user()) return false;
        if (!member?.user().presence()?.status) return false;
        if (server()?.defaultRoleId === role!.id && !member?.unhiddenRole())
          return true;
        if (member?.unhiddenRole()?.id === role!.id) return true;
      });

    return { role, members: createMemo(() => membersInThisRole()) };
  });

  const offlineMembers = createMemo(() =>
    members().filter((member) => !member?.user().presence()?.status),
  );
  const defaultRole = () =>
    serverRoles.get(server()?.id!, server()?.defaultRoleId!);
  return (
    <Show when={params.channelId} keyed={true}>
      <Delay ms={10}>
        <>
          <div
            style={{
              "margin-left": "8px",
              "margin-top": "8px",
              display: "flex",
            }}
          >
            <Text size={14}>{t("informationDrawer.members")}</Text>
            <div class={styles.memberCount}>
              {members().length.toLocaleString()}
            </div>
          </div>
          <div class={styles.roleContainer}>
            <For each={roleMembers()}>
              {(item) => (
                <Show when={!item.role!.hideRole && item.members().length}>
                  <RoleItem
                    members={item
                      .members()
                      .sort((a, b) =>
                        a?.user().username.localeCompare(b?.user().username),
                      )}
                    roleName={item.role?.name!}
                    roleIcon={item.role?.icon!}
                  />
                </Show>
              )}
            </For>

            {/* Offline */}
            <RoleItem
              members={offlineMembers().sort((a, b) =>
                a?.user().username.localeCompare(b?.user().username),
              )}
              roleName={t("status.offline")}
              roleIcon={defaultRole()?.icon}
            />
          </div>
        </>
      </Delay>
    </Show>
  );
};

function RoleItem(props: {
  roleName: string;
  members: ServerMember[];
  roleIcon?: string;
}) {
  const [expanded, setExpanded] = createSignal(true);
  const [hovered, setHovered] = createSignal(false);

  return (
    <div
      class={styles.roleItem}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div class={styles.roleTitle} onClick={() => setExpanded(!expanded())}>
        <Show when={props.roleIcon}>
          <Emoji
            hovered={hovered()}
            size={16}
            resize={26}
            icon={props.roleIcon}
          />
        </Show>
        <div class={styles.roleName}>{props.roleName}</div>
        <div class={styles.roleCount}>
          {props.members.length.toLocaleString()}
        </div>
        <Button
          class={styles.roleExpandButton}
          padding={1}
          iconName={expanded() ? "keyboard_arrow_down" : "keyboard_arrow_up"}
          iconSize={16}
        />
      </div>
      <Show when={expanded()}>
        <VirtualList
          scrollContainer={
            document.querySelector("._rightPane_177w9_66 .go1493520435")!
          }
          items={props.members.map((m) => ({
            id: m.userId,
            height: 50,
            element: (style) => <MemberItem member={m} style={style} />,
          }))}
        />
      </Show>
    </div>
  );
}

const ServerChannelNotice = () => {
  const params = useParams<{ channelId: string }>();

  const cachedNotice = () => getCachedNotice(() => params.channelId);

  return (
    <Show when={cachedNotice()}>
      <div class={styles.channelNotice}>
        <div class={styles.channelNoticeHeader}>
          <Icon color="var(--primary-color)" name="info" size={14} />
          <Text size={13}>{t("informationDrawer.channelNotice")}</Text>
        </div>
        <div class={styles.channelNoticeContent}>
          <Markup inline text={cachedNotice()!.content} />
        </div>
      </div>
    </Show>
  );
};

const normalizeText = (str?: string) => str?.normalize("NFKC") || "";

function getTextBeforeCursor(element?: HTMLInputElement) {
  if (!element) return "";
  const cursorPosition = element.selectionStart || 0;
  const textBeforeCursor = element.value.substring(0, cursorPosition);
  const lastWord = textBeforeCursor.split(/\s+/).reverse()[0];
  return lastWord;
}

const SearchInputBox = (props: {
  channel?: Channel;
  query: string;
  setQuery: (query: string) => void;
  users: ServerMember[];
  setUsers: (users: ServerMember[]) => void;
}) => {
  const store = useStore();
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();

  const [textBefore, setTextBefore] = createSignal("");
  const [isFocus, setIsFocus] = createSignal(false);
  const onFocus = () => setIsFocus(true);

  const onSelectionChange = () => {
    if (!isFocus()) return;
    update();
  };

  createEffect(() => {
    inputRef()?.addEventListener("focus", onFocus);
    document.addEventListener("selectionchange", onSelectionChange);
    onCleanup(() => {
      inputRef()?.removeEventListener("focus", onFocus);
      document.removeEventListener("selectionchange", onSelectionChange);
    });
  });

  const update = () => {
    if (inputRef()?.selectionStart !== inputRef()?.selectionEnd)
      return setIsFocus(false);
    setIsFocus(true);
    const textBefore = getTextBeforeCursor(inputRef());
    setTextBefore(normalizeText(textBefore));
  };

  const members = () => store.serverMembers.array(params.serverId!);

  const suggestUsers = () => textBefore().startsWith("@");
  const userSearchQuery = () => textBefore().substring(1);
  const searchedServerUsers = createMemo(() => {
    if (!suggestUsers()) return [];
    return matchSorter(
      members(),

      userSearchQuery(),
      {
        keys: [
          (e) => normalizeText(e?.user?.().username),
          (e) => normalizeText(e?.nickname!),
        ],
      },
    ).slice(0, 10);
  });

  const handleSuggestUserClick = (member: ServerMember) => {
    if (props.users.find((u) => u.userId === member.userId)) return;
    props.setUsers([...props.users, member]);

    const input = inputRef();
    if (!input || input.selectionStart === null) return;

    const cursorPos = input.selectionStart;
    const beforeCursor = input.value.substring(0, cursorPos);

    const lastAtIndex = beforeCursor.lastIndexOf("@");
    if (lastAtIndex === -1) return;

    const beforeMention = input.value.substring(0, lastAtIndex);
    const afterCursor = input.value.substring(cursorPos);
    const newQuery = beforeMention + afterCursor;

    props.setQuery(newQuery);

    input.focus();
    input.setSelectionRange(lastAtIndex, lastAtIndex);
    update();
  };

  return (
    <>
      <Input
        ref={setInputRef}
        placeholder={
          props.channel?.name
            ? t("informationDrawer.searchBarChannelPlaceholder", {
                channelName: props.channel!.name,
                interpolation: { escapeValue: false },
              })
            : props.channel?.recipient()?.username
              ? t("informationDrawer.searchBarPlaceholder", {
                  username: props.channel?.recipient()?.username,
                  interpolation: { escapeValue: false },
                })
              : ""
        }
        onText={props.setQuery}
        value={props.query}
        onBlur={() => setIsFocus(false)}
      />
      <Show when={isFocus() && searchedServerUsers().length}>
        <div class={styles.searchUserSuggestions}>
          <For each={searchedServerUsers()}>
            {(member) => (
              <div
                class={styles.searchUserSuggestionItem}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => handleSuggestUserClick(member!)}
              >
                <Avatar size={24} user={member?.user()} resize={28} />
                <div>{member?.nickname || member?.user()?.username}</div>
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.users.length}>
        <div class={styles.searchSelectedUsers}>
          <For each={props.users}>
            {(member) => (
              <div
                class={styles.searchSelectedUser}
                onClick={() => {
                  props.setUsers(
                    props.users.filter((u) => u.userId !== member.userId),
                  );
                }}
              >
                <Avatar size={20} user={member?.user()} resize={28} />
                <div>{member?.nickname || member?.user()?.username}</div>
                <Icon
                  name="close"
                  size={18}
                  class={styles.removeSelectedUser}
                />
              </div>
            )}
          </For>
        </div>
      </Show>
    </>
  );
};

const SearchDrawer = () => {
  const store = useStore();
  const params = useParams<{ serverId?: string; channelId?: string }>();

  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<RawMessage[] | null>(null);
  const [containerEl, setContainerEl] = createSignal<HTMLDivElement>();
  const [order, setOrder] = createSignal<"asc" | "desc">("desc");

  const [users, setUsers] = createSignal<ServerMember[]>([]);

  const { width: containerWidth } = useResizeObserver(containerEl);

  const channel = () => store.channels.get(params.channelId!);

  let interval = 0;
  createEffect(
    on([query, order, users], () => {
      setResults(null);
      window.clearTimeout(interval);

      interval = window.setTimeout(() => {
        const userIds = users().map((u) => u.userId);
        searchMessages(query(), params.channelId!, {
          order: order(),
          userIds,
        }).then((res) => {
          if (order() === "desc") res.reverse();
          setResults(res);
        });
      }, 1000);
    }),
  );
  onCleanup(() => window.clearTimeout(interval));

  return (
    <div class={styles.searchDrawer} ref={setContainerEl}>
      <SearchInputBox
        setUsers={setUsers}
        users={users()}
        channel={channel()}
        query={query()}
        setQuery={setQuery}
      />
      <FlexRow gap={4} class={styles.searchOrder}>
        <Item.Root
          onClick={() => setOrder("desc")}
          selected={order() === "desc"}
          handlePosition="bottom"
        >
          <Item.Label>{t("informationDrawer.sortLatest")}</Item.Label>
        </Item.Root>
        <Item.Root
          onClick={() => setOrder("asc")}
          selected={order() === "asc"}
          handlePosition="bottom"
        >
          <Item.Label>{t("informationDrawer.sortOldest")}</Item.Label>
        </Item.Root>
      </FlexRow>
      <div class={styles.searchResults}>
        <Show when={results() === null}>
          <Skeleton.List count={50}>
            <Skeleton.Item height={"80px"} width={"100%"} />
          </Skeleton.List>
        </Show>
        <Show when={results()?.length}>
          <For each={results()}>
            {(message) => (
              <SearchMessageItem
                message={message}
                containerWidth={containerWidth()}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

const SearchMessageItem = (props: {
  message: RawMessage;
  containerWidth?: number;
}) => {
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const navigate = useNavigate();
  const onJump = () => {
    const channelId = props.message.channelId;
    if (params.serverId) {
      navigate(
        RouterEndpoints.SERVER_MESSAGES(params.serverId, channelId) +
          "?messageId=" +
          props.message.id,
      );
    } else {
      navigate(
        RouterEndpoints.INBOX_MESSAGES(channelId) +
          "?messageId=" +
          props.message.id,
      );
    }
  };
  return (
    <div class={styles.searchMessageItem}>
      <div onClick={onJump} class={styles.jumpToMessage}>
        {t("mainPaneHeader.jump")}
      </div>
      <MessageItem
        message={props.message}
        hideFloating
        containerWidth={props.containerWidth}
      />
    </div>
  );
};

export default RightDrawer;
