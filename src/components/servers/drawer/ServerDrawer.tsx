import styles from './styles.module.scss';

import { classNames, conditionalClass } from '@/common/classNames';
import RouterEndpoints from '@/common/RouterEndpoints';
import Header from './header/ServerDrawerHeader';
import { Link, useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { For, Match, Show, Switch, createEffect, createMemo, on, onCleanup } from 'solid-js';
import { Channel } from '@/chat-api/store/useChannels';
import ItemContainer from '@/components/ui/Item';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { ChannelType } from '@/chat-api/RawData';
import Icon from '@/components/ui/icon/Icon';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import { CHANNEL_PERMISSIONS, hasBit } from '@/chat-api/Bitwise';
import env from '@/common/env';
import { unicodeToTwemojiUrl } from '@/emoji';
import { createSignal } from 'solid-js';
import Avatar from '@/components/ui/Avatar';
import { timeElapsed } from '@/common/date';
import InVoiceActions from '@/components/InVoiceActions';




const ServerDrawer = () => {
  return (
    <div class={styles.serverDrawer}>
      <div style={{display: 'flex', "flex-direction": 'column', height: "100%", overflow: 'auto'}}>
        <Header />
        <ChannelList />
      </div>
      <InVoiceActions />
    </div>
  )
};



const ChannelList = () => {
  const params = useParams();
  const { channels } = useStore();
  const sortedServerChannels = () => channels.getSortedChannelsByServerId(params.serverId, true).filter(channel => !channel?.categoryId);

  return (
    <div class={styles.channelList}>
      <For each={sortedServerChannels()}>
        {channel => (
          <Switch>
            <Match when={channel!.type === ChannelType.SERVER_TEXT}>
              <ChannelItem channel={channel!} selected={params.channelId === channel!.id} />
            </Match>
            <Match when={channel!.type === ChannelType.CATEGORY}>
              <CategoryItem channel={channel!} selected={params.channelId === channel!.id} />
            </Match>
          </Switch>
        )}
      </For>
    </div>
  )
};



const ChannelIconContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  width: 18px;
  `;
const ChannelIconImage = styled('img')`
  border-radius: 4px;
  height: 18px;
  width: 18px;
`;


export const ChannelIcon = (props: { icon?: string; isCategory?: boolean; hovered?: boolean }) => {
  const url = () => {
    if (props.icon!.includes(".")) {
      return `${env.NERIMITY_CDN}emojis/${props.icon}${!props.hovered && props.icon?.endsWith(".gif") ? "?type=webp" : ''}`
    }
    return unicodeToTwemojiUrl(props.icon!);
  }
  return (
    <ChannelIconContainer>
      <Show when={!props.icon && props.isCategory}>
        <Icon name='segment' color='rgba(255,255,255,0.6)' size={18} />
      </Show>
      <Show when={!props.icon && !props.isCategory}>
        <Text color='rgba(255,255,255,0.6)'>#</Text>
      </Show>
      <Show when={props.icon}>
        <ChannelIconImage src={url()} />
      </Show>
    </ChannelIconContainer>
  )
}

const ChannelContainer = styled(ItemContainer)`
  height: 32px;
  padding-left: 10px;
  gap: 5px;

  
  .label {
    opacity: ${props => props.selected ? 1 : 0.6};
    transition: 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
`
const CategoryItemContainer = styled(FlexRow)`
  margin-top: 5px;
  margin-bottom: 5px;
  align-items: center;
`

function CategoryItem(props: { channel: Channel, selected: boolean }) {
  const params = useParams();
  const { channels } = useStore();
  const [hovered, setHovered] = createSignal(false);

  const sortedServerChannels = createMemo(() => channels.getSortedChannelsByServerId(params.serverId, true).filter(channel => channel?.categoryId === props.channel.id));
  const isPrivateChannel = () => hasBit(props.channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);


  return (
    <CategoryContainer onmouseenter={() => setHovered(true)} onmouseleave={() => setHovered(false)}>

      <CategoryItemContainer gap={5}>
        <ChannelIcon icon={props.channel.icon} isCategory hovered={hovered()} />
        <Show when={isPrivateChannel()}>
          <Icon name='lock' size={14} style={{ opacity: 0.3 }} />
        </Show>
        <Text class="label" size={14} opacity={0.6}>{props.channel.name}</Text>
      </CategoryItemContainer>

      <Show when={sortedServerChannels().length}>
        <div class={styles.categoryChannelList}>
          <For each={sortedServerChannels()}>
            {channel => (
              <ChannelItem channel={channel!} selected={params.channelId === channel!.id} />
            )}
          </For>
        </div>
      </Show>
    </CategoryContainer>
  )
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

function ChannelItem(props: { channel: Channel, selected: boolean }) {
  const { channel } = props;
  const [hovered, setHovered] = createSignal(false);

  const hasNotifications = () => channel.hasNotifications;

  const isPrivateChannel = () => hasBit(props.channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);


  return (

    <Link
      href={RouterEndpoints.SERVER_MESSAGES(channel.serverId!, channel.id)}
      style={{ "text-decoration": "none" }}
    >
      <ChannelContainer onMouseEnter={() => setHovered(true)} onmouseleave={() => setHovered(false)} selected={props.selected} alert={hasNotifications()}>
        <ChannelIcon icon={props.channel.icon} hovered={hovered()} />
        <Show when={isPrivateChannel()}>
          <Icon name='lock' size={14} style={{ opacity: 0.3, "margin-right": "5px" }} />
        </Show>
        <Text class="label">{channel.name}</Text>
        <Show when={props.channel.mentionCount}>
          <MentionCountContainer>{props.channel.mentionCount}</MentionCountContainer>
        </Show>
      </ChannelContainer>
      <ChannelItemVoiceUsers channelId={props.channel.id} />
    </Link>

  )
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

  const channelVoiceUsers = () => Object.values(voiceUsers.getVoiceInChannel(props.channelId) || {});

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
            {voiceUser => <Avatar user={voiceUser!.user} size={20} />}
          </For>
        </ChannelVoiceUsersListContainer>
      </ChannelVoiceUsersContainer>
    </Show>
  )
}

function CallTime(props: { channelId: string }) {
  const { channels } = useStore();
  const channel = () => channels.get(props.channelId)

  const [time, setTime] = createSignal<null | string>(null);

  createEffect(on(() => channel()?.callJoinedAt, (joinedAt) => {
    let interval: number;
    if (joinedAt) {
      setTime(timeElapsed(joinedAt))
      interval = window.setInterval(() =>
        setTime(timeElapsed(joinedAt))
        , 1000)
    }
    onCleanup(() => {
      interval && clearInterval(interval);
    })
  }))

  return (
    <Show when={channel()?.callJoinedAt}>
      <Text size={12} opacity={0.6} style={{ "margin-left": "auto" }}>{time()}</Text>
    </Show>
  )
}


export default ServerDrawer;