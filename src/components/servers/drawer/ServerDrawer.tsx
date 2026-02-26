import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import Header from "./header/ServerDrawerHeader";
import { A, useMatch, useNavigate, useParams } from "solid-navigator";
import useStore from "@/chat-api/store/useStore";
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount
} from "solid-js";
import { Channel } from "@/chat-api/store/useChannels";
import ItemContainer from "@/components/ui/LegacyItem";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import {
  ChannelType,
  ServerNotificationPingMode,
  ServerNotificationSoundMode
} from "@/chat-api/RawData";
import Icon from "@/components/ui/icon/Icon";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import {
  CHANNEL_PERMISSIONS,
  hasBit,
  ROLE_PERMISSIONS
} from "@/chat-api/Bitwise";
import env from "@/common/env";
import { unicodeToTwemojiUrl } from "@/emoji";
import { createSignal } from "solid-js";
import Avatar from "@/components/ui/Avatar";
import { timeSinceDigital } from "@/common/date";
import InVoiceActions from "@/components/InVoiceActions";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
import ContextMenuServerChannel from "../context-menu/ContextMenuServerChannel";
import Button from "@/components/ui/Button";
import { ChannelIcon } from "@/components/ChannelIcon";
import { useCustomScrollbar } from "@/components/custom-scrollbar/CustomScrollbar";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { CreateChannelModal } from "../modals/CreateChannelModal";
import { useExperiment } from "@/common/experiments";
import { useWindowProperties } from "@/common/useWindowProperties";
import { cn } from "@/common/classNames";
import { Tooltip } from "@/components/ui/Tooltip";
import { useCollapsedServerCategories } from "@/common/localStorage";
import { messagesPreloader } from "@/common/createPreloader";
import { t } from "@nerimity/i18lite";

const ServerDrawer = () => {
  const params = useParams<{ serverId: string }>();
  const store = useStore();
  const { isMobileWidth } = useWindowProperties();

  const server = () => store.servers.get(params.serverId);
  return (
    <>
      <Header />
      <div class={styles.serverDrawer}>
        <div class={styles.serverDrawerInner}>
          <Show when={server()?.joinedThisSession}>
            <JoinedThisSessionNotificationNotice />
          </Show>
          <MembersItem />
          <Show when={server()?._count?.welcomeQuestions}>
            <CustomizeItem />
          </Show>
          <ChannelList />
          <InVoiceActions
            style={
              isMobileWidth()
                ? { bottom: "calc(var(--bottom-pane-gap) + 6px)" }
                : {}
            }
          />
        </div>
      </div>
    </>
  );
};

const CustomizeItem = () => {
  const params = useParams<{ serverId: string }>();
  const match = useMatch(() =>
    RouterEndpoints.SERVER_MESSAGES(params.serverId!, "welcome")
  );
  return (
    <div class={styles.welcomeItemContainer}>
      <A
        style={{ "text-decoration": "none" }}
        href={RouterEndpoints.SERVER_MESSAGES(params.serverId!, "welcome")}
      >
        <ChannelContainer selected={match()}>
          <Icon name="tune" size={16} />
          <div class="label">{t("channelDrawer.customize.title")}</div>
        </ChannelContainer>
      </A>
    </div>
  );
};
const MembersItem = () => {
  const params = useParams<{ serverId: string }>();
  const match = useMatch(() =>
    RouterEndpoints.SERVER_MESSAGES(params.serverId!, "members")
  );
  return (
    <div class={styles.membersItemContainer}>
      <A
        style={{ "text-decoration": "none" }}
        href={RouterEndpoints.SERVER_MESSAGES(params.serverId!, "members")}
      >
        <ChannelContainer selected={match()}>
          <Icon name="group" size={16} />
          <div class="label">{t("informationDrawer.members")}</div>
        </ChannelContainer>
      </A>
    </div>
  );
};

const ChannelList = () => {
  const params = useParams();
  const { channels, account } = useStore();
  const navigate = useNavigate();

  const [contextMenuDetails, setContextMenuDetails] = createSignal<
    | {
        position: { x: number; y: number };
        serverId: string;
        channelId: string;
      }
    | undefined
  >();

  const sortedChannels = () =>
    channels.getSortedChannelsByServerId(params.serverId, true, true);
  const sortedRootChannels = () =>
    sortedChannels().filter((channel) => !channel?.categoryId);
  const channelsWithoutCategory = () =>
    sortedChannels().filter(
      (channel) => channel?.type !== ChannelType.CATEGORY
    );
  const selectedChannelIndex = () =>
    channelsWithoutCategory().findIndex(
      (channel) => channel?.id === params.channelId
    );

  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.altKey) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();
      let newIndex = selectedChannelIndex();

      if (selectedChannelIndex() < channelsWithoutCategory().length - 1) {
        newIndex = selectedChannelIndex() + 1;
      } else {
        newIndex = 0;
      }
      navigate(
        `/app/servers/${params.serverId}/${
          channelsWithoutCategory()[newIndex]?.id
        }`
      );
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      let newIndex = selectedChannelIndex();

      if (selectedChannelIndex() > 0) {
        newIndex = selectedChannelIndex() - 1;
      } else {
        newIndex = channelsWithoutCategory().length - 1;
      }
      navigate(
        `/app/servers/${params.serverId}/${
          channelsWithoutCategory()[newIndex]?.id
        }`
      );
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  const onChannelContextMenu = (event: MouseEvent, channelId: string) => {
    event.preventDefault();
    setContextMenuDetails({
      position: { x: event.clientX, y: event.clientY },
      serverId: params.serverId!,
      channelId
    });
  };

  return (
    <div class={styles.channelList}>
      <ContextMenuServerChannel
        {...contextMenuDetails()}
        onClose={() => setContextMenuDetails(undefined)}
      />

      <Show
        when={account.lastAuthenticatedAt()}
        fallback={<ChannelListSkeleton />}
      >
        <For each={sortedRootChannels()}>
          {(channel) => (
            <Switch
              fallback={
                <ChannelItem
                  expanded
                  onContextMenu={(e) => onChannelContextMenu(e, channel!.id)}
                  channel={channel!}
                  selected={params.channelId === channel!.id}
                />
              }
            >
              <Match when={channel!.type === ChannelType.CATEGORY}>
                <CategoryItem
                  onChannelContextMenu={onChannelContextMenu}
                  channel={channel!}
                  selected={params.channelId === channel!.id}
                />
              </Match>
            </Switch>
          )}
        </For>
      </Show>
    </div>
  );
};

const ChannelListSkeleton = () => {
  return (
    <Skeleton.List>
      <Skeleton.Item height="34px" width="100%" />
    </Skeleton.List>
  );
};

const ChannelContainer = styled(ItemContainer)`
  height: 32px;
  padding-left: 10px;
  gap: 8px;

  .label {
    opacity: ${(props) => (props.selected ? 1 : 0.6)};
    transition: 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    color: var(--text-color);
    flex: 1;
  }
  &:hover .label {
    opacity: 1;
  }

  .channelDefaultIcon {
    opacity: 0.4;
  }
`;

function CategoryItem(props: {
  channel: Channel;
  selected: boolean;
  onChannelContextMenu: (event: MouseEvent, channelId: string) => void;
}) {
  const params = useParams();
  const { channels, account, serverMembers } = useStore();
  const [hovered, setHovered] = createSignal(false);
  const { createPortal } = useCustomPortal();

  const [collapsedServerCategories, setCollapsedServerCategories] =
    useCollapsedServerCategories();

  const member = () => serverMembers.get(params.serverId, account.user()?.id!);
  const hasModeratorPermission = () =>
    serverMembers.hasPermission(member()!, ROLE_PERMISSIONS.MANAGE_CHANNELS);

  const sortedServerChannels = createMemo(() =>
    channels
      .getSortedChannelsByServerId(params.serverId, true)
      .filter((channel) => channel?.categoryId === props.channel.id)
  );

  const isPrivateCategory = () => {
    const user = member();
    if (serverMembers.hasPermission(user!, ROLE_PERMISSIONS.MANAGE_CHANNELS)) {
      return false;
    }

    const noViewableChannels = sortedServerChannels().every(
      (channel) =>
        !channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL, true)
    );

    return (
      !props.channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL, true) ||
      noViewableChannels
    );
  };

  const expanded = () => {
    return !collapsedServerCategories().includes(props.channel.id);
  };

  const setExpanded = (value: boolean) => {
    const newCollapsedCategories = [...collapsedServerCategories()];
    if (value) {
      const index = newCollapsedCategories.indexOf(props.channel.id);
      if (index > -1) {
        newCollapsedCategories.splice(index, 1);
      }
    } else {
      newCollapsedCategories.push(props.channel.id);
    }
    setCollapsedServerCategories(newCollapsedCategories);
  };

  const onAddChannelClick = (event: MouseEvent) => {
    event.stopPropagation();
    createPortal?.((close) => (
      <CreateChannelModal
        close={close}
        serverId={params.serverId!}
        categoryId={props.channel.id}
      />
    ));
  };

  return (
    <Show when={!isPrivateCategory() || sortedServerChannels().length}>
      <div
        class={styles.categoryContainer}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          class={styles.categoryItemContainer}
          onClick={() => setExpanded(!expanded())}
          classList={{ [styles.hide!]: !expanded() }}
        >
          <Icon
            size={14}
            name="keyboard_arrow_down"
            class={cn(expanded() && styles.expanded, styles.expandIcon)}
          />

          <ChannelIcon
            icon={props.channel.icon}
            type={props.channel.type}
            hovered={hovered()}
            class={styles.categoryItemChannelIcon}
          />
          <Show when={isPrivateCategory()}>
            <Icon name="lock" size={14} style={{ opacity: 0.3 }} />
          </Show>
          <div class={styles.label}>{props.channel.name}</div>

          <div class={styles.categoryButtons}>
            <Show when={hasModeratorPermission()}>
              <Tooltip tooltip={t("channelDrawer.addChannel")}>
                <Button
                  class={styles.addChannelButton}
                  padding={4}
                  margin={0}
                  iconName="add"
                  iconSize={16}
                  onClick={onAddChannelClick}
                />
              </Tooltip>
            </Show>
          </div>
        </div>

        <Show when={sortedServerChannels().length}>
          <div class={styles.categoryChannelList}>
            <For each={sortedServerChannels()}>
              {(channel) => (
                <ChannelItem
                  expanded={expanded()}
                  onContextMenu={(e) =>
                    props.onChannelContextMenu(e, channel!.id!)
                  }
                  channel={channel!}
                  selected={params.channelId === channel!.id}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}

const MentionCountContainer = styled(FlexRow)`
  align-items: center;
  text-align: center;
  justify-content: center;
  color: white;
  background-color: var(--alert-color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  font-size: 12px;
  margin-left: auto;
  margin-right: 5px;
`;

function ChannelItem(props: {
  expanded: boolean;
  channel: Channel;
  selected: boolean;
  onContextMenu: (event: MouseEvent) => void;
}) {
  const { channel } = props;
  const [hovered, setHovered] = createSignal(false);

  const hasNotifications = () => channel.hasNotifications();

  const isPrivateChannel = () =>
    !channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL, true);

  return (
    <Show when={props.expanded || props.selected || hasNotifications()}>
      <A
        onMouseEnter={() => {
          messagesPreloader.preload(channel.id);
        }}
        onClick={() => emitDrawerGoToMain()}
        onContextMenu={props.onContextMenu}
        href={RouterEndpoints.SERVER_MESSAGES(channel.serverId!, channel.id)}
        style={{ "text-decoration": "none" }}
      >
        <ChannelContainer
          onMouseEnter={() => setHovered(true)}
          onmouseleave={() => setHovered(false)}
          selected={props.selected}
          alert={hasNotifications()}
        >
          <ChannelIcon
            icon={props.channel.icon}
            type={props.channel.type}
            hovered={hovered()}
          />
          <div class="label">{channel.name}</div>
          <Show when={isPrivateChannel()}>
            <Icon
              name="lock"
              size={14}
              style={{ opacity: 0.3, "margin-right": "5px" }}
            />
          </Show>
          <Show when={props.channel.mentionCount()}>
            <MentionCountContainer>
              {props.channel.mentionCount()}
            </MentionCountContainer>
          </Show>
        </ChannelContainer>
        <ChannelItemVoiceUsers channelId={props.channel.id} />
      </A>
    </Show>
  );
}

const ChannelVoiceUsersContainer = styled(FlexColumn)`
  gap: 3px;
  padding: 5px;
  padding-left: 10px;
  background-color: hsl(216deg 7% 28% / 60%);
  border-radius: 8px;
  margin-top: 2px;
`;

const ChannelVoiceUsersListContainer = styled(FlexRow)`
  flex-wrap: wrap;
  gap: 3px;
  margin-left: 20px;
`;
const ChannelVoiceUsersTitle = styled(Text)`
  display: flex;
  gap: 3px;
  align-items: center;
`;

function ChannelItemVoiceUsers(props: { channelId: string }) {
  const { voiceUsers } = useStore();

  const channelVoiceUsers = () =>
    voiceUsers.getVoiceUsersByChannelId(props.channelId);

  return (
    <Show when={channelVoiceUsers().length}>
      <ChannelVoiceUsersContainer>
        <ChannelVoiceUsersTitle size={12}>
          <Icon name="call" size={16} color="rgba(255,255,255,0.4)" />
          {t("channelDrawer.inVoice")}
          <CallTime channelId={props.channelId} />
        </ChannelVoiceUsersTitle>
        <ChannelVoiceUsersListContainer>
          <For each={channelVoiceUsers()}>
            {(voiceUser) => <Avatar user={voiceUser!.user()} size={20} />}
          </For>
        </ChannelVoiceUsersListContainer>
      </ChannelVoiceUsersContainer>
    </Show>
  );
}

function CallTime(props: { channelId: string }) {
  const { channels } = useStore();
  const channel = () => channels.get(props.channelId);

  const [time, setTime] = createSignal<null | string>(null);

  createEffect(
    on(
      () => channel()?.callJoinedAt,
      (joinedAt) => {
        let interval: number;
        if (joinedAt) {
          setTime(timeSinceDigital(joinedAt));
          interval = window.setInterval(
            () => setTime(timeSinceDigital(joinedAt)),
            1000
          );
        }
        onCleanup(() => {
          interval && clearInterval(interval);
        });
      }
    )
  );

  return (
    <Show when={channel()?.callJoinedAt}>
      <Text
        size={12}
        opacity={0.6}
        style={{
          "margin-left": "auto",
          "font-variant-numeric": "tabular-nums"
        }}
      >
        {time()}
      </Text>
    </Show>
  );
}

function JoinedThisSessionNotificationNotice() {
  const params = useParams<{ serverId: string }>();
  const store = useStore();
  const server = () => store.servers.get(params.serverId);

  const dismiss = () => {
    server()?.update({ joinedThisSession: false });
  };

  const handleSetToMentionsOnly = () => {
    dismiss();
    store.account.updateUserNotificationSettings({
      notificationSoundMode: ServerNotificationSoundMode.MENTIONS_ONLY,
      notificationPingMode: ServerNotificationPingMode.MENTIONS_ONLY,
      serverId: params.serverId
    });
  };

  return (
    <div class={styles.joinedThisSessionNotice}>
      <Button
        iconName="close"
        iconSize={14}
        class={styles.closeIcon}
        onclick={dismiss}
      />
      <Icon name="notifications" size={30} />
      <div class={styles.details}>
        <div class={styles.text}>
          {t("serverDrawer.joinedThisSessionNotice")}
        </div>
        <Button
          label={t("serverDrawer.joinedThisSessionNoticeSetToMentionsOnly")}
          iconName="alternate_email"
          iconSize={16}
          onClick={handleSetToMentionsOnly}
        />
      </div>
    </div>
  );
}

export default ServerDrawer;
