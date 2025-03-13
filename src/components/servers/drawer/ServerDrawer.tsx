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
  onMount,
} from "solid-js";
import { Channel } from "@/chat-api/store/useChannels";
import ItemContainer from "@/components/ui/LegacyItem";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { ChannelType } from "@/chat-api/RawData";
import Icon from "@/components/ui/icon/Icon";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import {
  CHANNEL_PERMISSIONS,
  hasBit,
  ROLE_PERMISSIONS,
} from "@/chat-api/Bitwise";
import env from "@/common/env";
import { unicodeToTwemojiUrl } from "@/emoji";
import { createSignal } from "solid-js";
import Avatar from "@/components/ui/Avatar";
import { timeElapsed } from "@/common/date";
import InVoiceActions from "@/components/InVoiceActions";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
import ContextMenuServerChannel from "../context-menu/ContextMenuServerChannel";
import Button from "@/components/ui/Button";
import { ChannelIcon } from "@/components/ChannelIcon";
import { useCustomScrollbar } from "@/components/custom-scrollbar/CustomScrollbar";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { CreateChannelModal } from "../modals/CreateChannelModal";

const ServerDrawer = () => {
  const params = useParams<{ serverId: string }>();
  const store = useStore();
  const { isVisible } = useCustomScrollbar();

  const server = () => store.servers.get(params.serverId);
  return (
    <>
      <Header />
      <div class={styles.serverDrawer} data-scrollbar-visible={isVisible()}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            flex: 1,
          }}
        >
          <Show when={server()?._count?.welcomeQuestions}>
            <CustomizeItem />
          </Show>
          <ChannelList />
          <InVoiceActions />
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
          <Icon name="tune" color="rgba(255,255,255,0.6)" size={16} />
          <div class="label">Customize</div>
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
      channelId,
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
    color: white;
    flex: 1;
  }
  &:hover .label {
    opacity: 1;
  }

  .channelDefaultIcon {
    opacity: 0.4;
  }
`;
const CategoryContainer = styled(FlexColumn)`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0px;

  margin-top: 2px;
  margin-bottom: 2px;
`;
const CategoryItemContainer = styled(FlexRow)`
  align-items: center;
  cursor: pointer;
  border-radius: 8px;
  transition: 0.2s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  padding-left: 8px;

  .label {
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    font-size: 14px;
    font-weight: bold;
    transition: 0.2s;
  }
  .expand_icon {
    transition: 0.2s;
  }

  &.hide {
    .expand_icon {
      transform: rotate(180deg);
    }
    .label {
      opacity: 0.6;
      &:hover {
        opacity: 1;
      }
    }
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

  const member = () => serverMembers.get(params.serverId, account.user()?.id!);
  const hasModeratorPermission = () =>
    member()?.hasPermission(ROLE_PERMISSIONS.MANAGE_CHANNELS);

  const sortedServerChannels = createMemo(() =>
    channels
      .getSortedChannelsByServerId(params.serverId, true)
      .filter((channel) => channel?.categoryId === props.channel.id)
  );
  const isPrivateCategory = () =>
    !props.channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL, true);

  const [expanded, setExpanded] = createSignal(true);

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
      <CategoryContainer
        onmouseenter={() => setHovered(true)}
        onmouseleave={() => setHovered(false)}
      >
        <CategoryItemContainer
          gap={8}
          onClick={() => setExpanded(!expanded())}
          classList={{ hide: !expanded() }}
        >
          <ChannelIcon
            icon={props.channel.icon}
            type={props.channel.type}
            hovered={hovered()}
          />
          <Show when={isPrivateCategory()}>
            <Icon name="lock" size={14} style={{ opacity: 0.3 }} />
          </Show>
          <div class="label">{props.channel.name}</div>

          <div class={styles.categoryButtons}>
            <Show when={hasModeratorPermission()}>
              <Button
                class={styles.addChannelButton}
                padding={4}
                margin={0}
                iconName="add"
                iconSize={16}
                onClick={onAddChannelClick}
              />
            </Show>

            <Button
              iconClass="expand_icon"
              padding={4}
              class={styles.expandCategoryButton}
              margin={0}
              iconName="expand_more"
              iconSize={16}
            />
          </div>
        </CategoryItemContainer>

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
      </CategoryContainer>
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
          In Voice
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
          setTime(timeElapsed(joinedAt));
          interval = window.setInterval(
            () => setTime(timeElapsed(joinedAt)),
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
      <Text size={12} opacity={0.6} style={{ "margin-left": "auto" }}>
        {time()}
      </Text>
    </Show>
  );
}

export default ServerDrawer;
