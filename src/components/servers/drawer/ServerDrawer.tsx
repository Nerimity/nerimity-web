import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import Header from "./header/ServerDrawerHeader";
import { A, useMatch, useNavigate, useParams } from "solid-navigator";
import useStore from "@/chat-api/store/useStore";
import { For, Match, Show, Switch, createEffect, createMemo, on, onCleanup, onMount } from "solid-js";
import { Channel } from "@/chat-api/store/useChannels";
import ItemContainer from "@/components/ui/Item";
import {  styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { ChannelType } from "@/chat-api/RawData";
import Icon from "@/components/ui/icon/Icon";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { CHANNEL_PERMISSIONS, hasBit } from "@/chat-api/Bitwise";
import env from "@/common/env";
import { unicodeToTwemojiUrl } from "@/emoji";
import { createSignal } from "solid-js";
import Avatar from "@/components/ui/Avatar";
import { timeElapsed } from "@/common/date";
import InVoiceActions from "@/components/InVoiceActions";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
import ContextMenuServerChannel from "../context-menu/ContextMenuServerChannel";




const ServerDrawer = () => {
  return (
    <div class={styles.serverDrawer}>
      <div style={{display: "flex", "flex-direction": "column", height: "100%", overflow: "auto"}}>
        <Header />
        <CustomizeItem/>
        <ChannelList />
      </div>
      <InVoiceActions />
    </div>
  );
};

const CustomizeItem = () => {
  const params = useParams<{serverId: string}>();
  const match = useMatch(() => RouterEndpoints.SERVER_MESSAGES(params.serverId!, "welcome"));
  return (
    <div class={styles.welcomeItemContainer}>
      <A style={{ "text-decoration": "none" }} href={RouterEndpoints.SERVER_MESSAGES(params.serverId!, "welcome")}>
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

  const [contextMenuDetails, setContextMenuDetails] = createSignal<{ position: {x: number, y: number}, serverId: string, channelId: string } | undefined>();


  const sortedChannels = () => channels.getSortedChannelsByServerId(params.serverId, true);
  const sortedRootChannels = () => sortedChannels().filter(channel => !channel?.categoryId);
  const channelsWithoutCategory = () => sortedChannels().filter(channel => channel?.type !== ChannelType.CATEGORY);
  const selectedChannelIndex = () => channelsWithoutCategory().findIndex(channel => channel?.id === params.channelId);

  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.altKey) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();
      let newIndex = selectedChannelIndex();

      if (selectedChannelIndex() < channelsWithoutCategory().length - 1) {
        newIndex = selectedChannelIndex() + 1;
      }
      else {
        newIndex = 0;
      }
      navigate(`/app/servers/${params.serverId}/${channelsWithoutCategory()[newIndex]?.id}`);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      let newIndex = selectedChannelIndex();

      if (selectedChannelIndex() > 0) {
        newIndex = selectedChannelIndex() - 1;
      }
      else {
        newIndex = channelsWithoutCategory().length - 1;
      }
      navigate(`/app/servers/${params.serverId}/${channelsWithoutCategory()[newIndex]?.id}`);
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
      position: {x: event.clientX, y: event.clientY},
      serverId: params.serverId!,
      channelId
    });

  };

  return (
    <div class={styles.channelList}>
      <ContextMenuServerChannel {...contextMenuDetails()} onClose={() => setContextMenuDetails(undefined)} />

      <Show when={account.lastAuthenticatedAt()} fallback={<ChannelListSkeleton/>}>
        <For each={sortedRootChannels()}>
          {channel => (
            <Switch fallback={<ChannelItem onContextMenu={e => onChannelContextMenu(e, channel!.id)} channel={channel!} selected={params.channelId === channel!.id} />}>
              <Match when={channel!.type === ChannelType.CATEGORY}>
                <CategoryItem onChannelContextMenu={onChannelContextMenu} channel={channel!} selected={params.channelId === channel!.id} />
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
      <Skeleton.Item height="34px" width='100%'  />
    </Skeleton.List>
  );
};



const ChannelIconContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  width: 18px;
  `;
const ChannelIconImage = styled("img")`
  border-radius: 4px;
  height: 18px;
  width: 18px;
`;


export const ChannelIcon = (props: { icon?: string; type?: ChannelType; hovered?: boolean }) => {
  const url = () => {
    if (props.icon!.includes(".")) {
      const url = new URL(`${env.NERIMITY_CDN}emojis/${props.icon}${!props.hovered && props.icon?.endsWith(".gif") ? "?type=webp" : ""}`);
      url.searchParams.set("size", "36");
      return url.href;
    }
    return unicodeToTwemojiUrl(props.icon!);
  };
  const iconName = () => {
    if (props.type === ChannelType.CATEGORY) return "segment";
  };

  return (
    <ChannelIconContainer>
      <Show when={!props.icon}>
        <Show when={props.type !== ChannelType.SERVER_TEXT} fallback={<Text color='rgba(255,255,255,0.6)'>#</Text>}>
          <Icon name={iconName()} color='rgba(255,255,255,0.6)' size={18} />
        </Show>
      </Show>
      <Show when={props.icon}>
        <ChannelIconImage src={url()} />
      </Show>
    </ChannelIconContainer>
  );
};

const ChannelContainer = styled(ItemContainer)`
  height: 34px;
  padding-left: 10px;
  gap: 5px;

  
  .label {
    opacity: ${props => props.selected ? 1 : 0.6};
    transition: 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
    color: white;
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
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 5px;
  
  margin-top: 2px;
  margin-bottom: 2px;
`;
const CategoryItemContainer = styled(FlexRow)`
  margin-top: 5px;
  margin-bottom: 5px;
  align-items: center;
`;

function CategoryItem(props: { channel: Channel, selected: boolean, onChannelContextMenu: (event: MouseEvent, channelId: string) => void }) {
  const params = useParams();
  const { channels } = useStore();
  const [hovered, setHovered] = createSignal(false);

  const sortedServerChannels = createMemo(() => channels.getSortedChannelsByServerId(params.serverId, true).filter(channel => channel?.categoryId === props.channel.id));
  const isPrivateChannel = () => hasBit(props.channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);


  return (
    <CategoryContainer onmouseenter={() => setHovered(true)} onmouseleave={() => setHovered(false)}>

      <CategoryItemContainer gap={5}>
        <ChannelIcon icon={props.channel.icon} type={props.channel.type} hovered={hovered()} />
        <Show when={isPrivateChannel()}>
          <Icon name='lock' size={14} style={{ opacity: 0.3 }} />
        </Show>
        <div class="label">{props.channel.name}</div>
      </CategoryItemContainer>

      <Show when={sortedServerChannels().length}>
        <div class={styles.categoryChannelList}>
          <For each={sortedServerChannels()}>
            {channel => (
              <ChannelItem onContextMenu={e => props.onChannelContextMenu(e, channel!.id!)} channel={channel!} selected={params.channelId === channel!.id} />
            )}
          </For>
        </div>
      </Show>
    </CategoryContainer>
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

function ChannelItem(props: { channel: Channel, selected: boolean, onContextMenu: (event: MouseEvent) => void }) {
  const { channel } = props;
  const [hovered, setHovered] = createSignal(false);

  const hasNotifications = () => channel.hasNotifications();

  const isPrivateChannel = () => hasBit(props.channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);


  return (

    <A 
      onClick={() => emitDrawerGoToMain()}
      onContextMenu={props.onContextMenu}
      href={RouterEndpoints.SERVER_MESSAGES(channel.serverId!, channel.id)}
      style={{ "text-decoration": "none" }}
    >
      <ChannelContainer onMouseEnter={() => setHovered(true)} onmouseleave={() => setHovered(false)} selected={props.selected} alert={hasNotifications()}>
        <ChannelIcon icon={props.channel.icon} type={props.channel.type} hovered={hovered()} />
        <Show when={isPrivateChannel()}>
          <Icon name='lock' size={14} style={{ opacity: 0.3, "margin-right": "5px" }} />
        </Show>
        <div class="label">{channel.name}</div>
        <Show when={props.channel.mentionCount()}>
          <MentionCountContainer>{props.channel.mentionCount()}</MentionCountContainer>
        </Show>
      </ChannelContainer>
      <ChannelItemVoiceUsers channelId={props.channel.id} />
    </A>

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

  const channelVoiceUsers = () => voiceUsers.getVoiceUsers(props.channelId);

  return (
    <Show when={channelVoiceUsers().length}>
      <ChannelVoiceUsersContainer>
        <ChannelVoiceUsersTitle size={12}>
          <Icon name='call' size={16} color='rgba(255,255,255,0.4)' />
          In Voice
          <CallTime channelId={props.channelId} />
        </ChannelVoiceUsersTitle>
        <ChannelVoiceUsersListContainer>
          <For each={channelVoiceUsers()}>
            {voiceUser => <Avatar user={voiceUser!.user()} size={20} />}
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

  createEffect(on(() => channel()?.callJoinedAt, (joinedAt) => {
    let interval: number;
    if (joinedAt) {
      setTime(timeElapsed(joinedAt));
      interval = window.setInterval(() =>
        setTime(timeElapsed(joinedAt))
      , 1000);
    }
    onCleanup(() => {
      interval && clearInterval(interval);
    });
  }));

  return (
    <Show when={channel()?.callJoinedAt}>
      <Text size={12} opacity={0.6} style={{ "margin-left": "auto" }}>{time()}</Text>
    </Show>
  );
}


export default ServerDrawer;