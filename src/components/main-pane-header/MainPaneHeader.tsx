import styles from "./styles.module.scss";
import { classNames, conditionalClass } from "@/common/classNames";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/icon/Icon";
import useStore from "@/chat-api/store/useStore";
import UserPresence from "@/components/user-presence/UserPresence";
import { useDrawer } from "../ui/drawer/Drawer";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show
} from "solid-js";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useMatch, useNavigate, useParams } from "solid-navigator";
import Button from "../ui/Button";
import {
  RawNotification,
  getUserNotificationsRequest
} from "@/chat-api/services/UserService";
import { FriendStatus, RawMessage } from "@/chat-api/RawData";
import MessageItem from "../message-pane/message-item/MessageItem";
import { useResizeObserver } from "@/common/useResizeObserver";
import Text from "../ui/Text";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CHANNEL_PERMISSIONS, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { fetchPinnedMessages } from "@/chat-api/services/MessageService";
import { t } from "@nerimity/i18lite";
import { VoiceHeader } from "./voice-header/VoiceHeader";

export default function MainPaneHeader() {
  const {
    servers,
    channels,
    users,
    header,
    voiceUsers,
    serverMembers,
    account,
    mentions,
    tickets,
    friends
  } = useStore();
  const { hasRightDrawer, ...drawer } = useDrawer();

  const isInboxMessages = useMatch(() => "/app/inbox/:id");
  const isServerMessages = useMatch(() => "/app/servers/:serverId/:channelId");
  const isMessages = () => isInboxMessages() || isServerMessages();

  const { isMobileWidth } = useWindowProperties();
  const [hovered, setHovered] = createSignal(false);

  const server = () => servers.get(header.details().serverId!);
  const user = () => users.get(header.details().userId!);

  const channel = () => channels.get(header.details().channelId!);
  const toggleLeftDrawer = () => {
    if (isMobileWidth()) drawer.toggleLeftDrawer();
    else drawer.toggleHideLeftDrawer();
  };
  const toggleRightDrawer = () => {
    if (isMobileWidth()) drawer.toggleRightDrawer();
    else drawer.toggleHideRightDrawer();
  };

  const details = () => {
    let subName = null;
    let title = null;
    if (server()) {
      subName = server()?.name;
    }
    if (user()) {
      title = user()!.username;
    }

    if (header.details().title) {
      title = header.details().title;
    }

    if (header.details().subName) {
      subName = header.details().subName;
    }
    return { subName, title };
  };

  const onCallClick = async () => {
    if (voiceUsers.currentUser()?.channelId === channel()?.id) return;
    channel()?.joinCall();
  };

  const [showMentionList, setShowMentionList] = createSignal<boolean>(false);
  const [showPinsList, setShowPinsList] = createSignal<boolean>(false);

  const onMentionButtonClick = () => {
    setShowPinsList(false);
    setShowMentionList(!showMentionList());
  };

  const togglePinPopup = () => {
    setShowMentionList(false);
    setShowPinsList(!showPinsList());
  };

  const canCall = () => {
    if (!header.details().channelId) return;
    if (!channel()?.serverId) return true;

    const hasChannelGotCallPermission = channel()?.hasPermission(
      CHANNEL_PERMISSIONS.JOIN_VOICE
    );
    if (hasChannelGotCallPermission) return true;
    const member = serverMembers.get(channel()?.serverId!, account.user()?.id!);
    const isAdmin = serverMembers.hasPermission(
      member!,
      ROLE_PERMISSIONS.ADMIN
    );
    return isAdmin;
  };

  const notificationCount = createMemo(() => {
    const friendRequestCount = friends
      .array()
      .filter((friend) => friend.status === FriendStatus.PENDING).length;

    const ticketNotifications = tickets.hasTicketNotification();

    const mentionsCount = mentions.array().reduce((count, mention) => {
      return count + (mention?.count || 0);
    }, 0);

    return friendRequestCount + mentionsCount + (ticketNotifications ? 1 : 0);
  });

  return (
    <>
      <div
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        class={classNames(
          styles.header,
          conditionalClass(isMobileWidth(), styles.isMobile)
        )}
      >
        <div class={styles.toggleLeftDrawerContainer}>
          <Show when={notificationCount() && isMobileWidth()}>
            <div class={styles.notificationCounter}>{notificationCount()}</div>
          </Show>
          <Button
            iconSize={24}
            iconName="menu"
            margin={[0, 8, 0, 8]}
            type="hover_border"
            onClick={toggleLeftDrawer}
          />
        </div>
        <div class={styles.iconContainer}>
          {server() && <Avatar size={28} server={server()} />}
          {user() && <Avatar class={styles.avatar} size={28} user={user()} />}
          {header.details().iconName && (
            <Icon
              size={24}
              name={header.details().iconName}
              class={classNames(
                styles.icon,
                conditionalClass(server() || user(), styles.hasAvatar)
              )}
            />
          )}
        </div>
        <div class={styles.details}>
          <div class={styles.title}>{details().title}</div>
          {details().subName && (
            <div class={styles.subTitle}>{details().subName}</div>
          )}
          {user() && (
            <UserPresence
              userId={user()?.id!}
              showOffline={true}
              animate={hovered()}
              hideAction
              useTitle
            />
          )}
        </div>
        <div class={styles.rightIcons}>
          <Show when={canCall()}>
            <Button
              type="hover_border"
              iconSize={24}
              margin={3}
              iconName="call"
              onClick={onCallClick}
            />
          </Show>
          <Show when={isMessages()}>
            <Button
              margin={3}
              iconSize={24}
              iconName="keep"
              type="hover_border"
              onClick={togglePinPopup}
              class="mentionListIcon"
            />
          </Show>
          <Button
            margin={3}
            iconSize={24}
            type="hover_border"
            iconName="alternate_email"
            onClick={onMentionButtonClick}
            class="mentionListIcon"
          />
          <Show when={hasRightDrawer()}>
            <Button
              iconSize={24}
              margin={3}
              type="hover_border"
              iconName="group"
              onClick={toggleRightDrawer}
            />
          </Show>
        </div>
      </div>
      <Show when={showMentionList()}>
        <MentionListPopup close={() => setShowMentionList(false)} />
      </Show>
      <Show when={showPinsList()}>
        <PinsListPopup close={() => setShowPinsList(false)} />
      </Show>
      <VoiceHeader channelId={header.details().channelId} />
    </>
  );
}

const MentionListPopup = (props: { close: () => void }) => {
  const { isMobileWidth } = useWindowProperties();
  const [elementRef, setElementRef] = createSignal<undefined | HTMLDivElement>(
    undefined
  );
  const { width } = useResizeObserver(elementRef);
  const navigate = useNavigate();
  const [notifications, setNotifications] = createSignal<
    RawNotification[] | null
  >(null);

  const fetchAndSetNotifications = async () => {
    const notifications = await getUserNotificationsRequest();
    setNotifications(notifications);
  };

  onMount(() => {
    fetchAndSetNotifications();
    document.addEventListener("click", onDocClick);
    onCleanup(() => {
      document.removeEventListener("click", onDocClick);
    });
  });

  const onDocClick = (event: MouseEvent) => {
    if (event.target instanceof HTMLElement) {
      if (event.target.closest(".mentionListIcon")) return;
      if (!event.target.closest(`.${styles.mentionListContainer}`))
        props.close();
    }
  };

  const onJump = (notification: RawNotification) => {
    const serverId = notification.server.id;
    const channelId = notification.message.channelId;
    navigate(
      RouterEndpoints.SERVER_MESSAGES(serverId, channelId) +
        "?messageId=" +
        notification.message.id
    );
    props.close();
  };

  return (
    <div
      ref={setElementRef}
      class={classNames(
        styles.mentionListContainer,
        conditionalClass(isMobileWidth(), styles.mobile)
      )}
    >
      <Show when={notifications() && !notifications()?.length}>
        <div class={styles.noMentions}>
          <Icon name="alternate_email" size={40} />
          <Text>{t("mainPaneHeader.mentions.noMentions")}</Text>
        </div>
      </Show>
      <Show when={notifications()}>
        <For each={notifications()}>
          {(notification) => (
            <div>
              <MentionServerHeader
                serverId={notification.server.id}
                channelId={notification.message.channelId}
              />
              <div class={styles.messageContainer}>
                <div
                  onClick={() => onJump(notification)}
                  class={styles.messageOverlay}
                >
                  <div class={styles.jumpToMessage}>
                    {t("mainPaneHeader.jump")}
                  </div>
                </div>

                <MessageItem
                  message={notification.message}
                  hideFloating
                  containerWidth={width()}
                />
              </div>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
};
const PinsListPopup = (props: { close: () => void }) => {
  const params = useParams<{ channelId: string; serverId: string }>();
  const { isMobileWidth } = useWindowProperties();
  const [elementRef, setElementRef] = createSignal<undefined | HTMLDivElement>(
    undefined
  );
  const { width } = useResizeObserver(elementRef);
  const navigate = useNavigate();
  const [messages, setMessages] = createSignal<RawMessage[] | null>(null);

  const fetchAndSetMessages = async () => {
    const result = await fetchPinnedMessages(params.channelId);
    setMessages(result.messages);
  };

  onMount(() => {
    fetchAndSetMessages();
    document.addEventListener("click", onDocClick);
    onCleanup(() => {
      document.removeEventListener("click", onDocClick);
    });
  });

  const onDocClick = (event: MouseEvent) => {
    if (event.target instanceof HTMLElement) {
      if (event.target.closest(".mentionListIcon")) return;
      if (!event.target.closest(`.${styles.mentionListContainer}`))
        props.close();
    }
  };

  const onJump = (message: RawMessage) => {
    const channelId = message.channelId;
    if (params.serverId) {
      navigate(
        RouterEndpoints.SERVER_MESSAGES(params.serverId, channelId) +
          "?messageId=" +
          message.id
      );
    } else {
      navigate(
        RouterEndpoints.INBOX_MESSAGES(channelId) + "?messageId=" + message.id
      );
    }
    props.close();
  };

  return (
    <div
      ref={setElementRef}
      class={classNames(
        styles.mentionListContainer,
        conditionalClass(isMobileWidth(), styles.mobile)
      )}
    >
      <Show when={messages() && !messages()?.length}>
        <div class={styles.noMentions}>
          <Icon name="keep" size={40} />
          <Text>{t("mainPaneHeader.pins.noPins")}</Text>
        </div>
      </Show>
      <Show when={messages()}>
        <For each={messages()}>
          {(message) => (
            <div>
              <div class={styles.messageContainer}>
                <div
                  onClick={() => onJump(message)}
                  class={styles.messageOverlay}
                >
                  <div class={styles.jumpToMessage}>
                    {t("mainPaneHeader.jump")}
                  </div>
                </div>

                <MessageItem
                  message={message}
                  hideFloating
                  containerWidth={width()}
                />
              </div>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
};

const MentionServerHeader = (props: {
  serverId: string;
  channelId: string;
}) => {
  const { servers, channels } = useStore();
  const server = () => servers.get(props.serverId);
  const channel = () => channels.get(props.channelId);

  return (
    <div class={styles.mentionServerHeader}>
      <Avatar server={server()} size={30} />
      <div class={styles.mentionHeaderDetails}>
        <Text size={14}>{server()!.name}</Text>
        <Show when={channel()?.name}>
          <Text size={12} opacity={0.6}>
            #{channel()?.name || ""}
          </Text>
        </Show>
      </div>
    </div>
  );
};
