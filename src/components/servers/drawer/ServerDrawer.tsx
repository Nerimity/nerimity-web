import styles from './styles.module.scss';

import { classNames, conditionalClass } from '@/common/classNames';
import RouterEndpoints from '@/common/RouterEndpoints';
import Header from './header/ServerDrawerHeader';
import { Link, useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { For, Match, Show, Switch, createMemo } from 'solid-js';
import { Channel } from '@/chat-api/store/useChannels';
import ItemContainer from '@/components/ui/Item';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { ChannelType } from '@/chat-api/RawData';
import Icon from '@/components/ui/icon/Icon';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import { CHANNEL_PERMISSIONS, hasBit } from '@/chat-api/Bitwise';




const ServerDrawer = () => {
  return (
    <div class={styles.serverDrawer}>
      <Header />
      <ChannelList />
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


const ChannelContainer = styled(ItemContainer)`
  height: 32px;
  padding-left: 10px;

  
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

  .channelIcon {
    opacity: 0.2;
    margin-right: 5px;
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

  const sortedServerChannels = createMemo(() => channels.getSortedChannelsByServerId(params.serverId, true).filter(channel => channel?.categoryId === props.channel.id));
  const isPrivateChannel = () => hasBit(props.channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);


  return (
    <CategoryContainer>

      <CategoryItemContainer gap={5}>
        <Icon name='segment' color='rgba(255,255,255,0.6)' size={18} />
        <Show when={isPrivateChannel()}>
          <Icon name='lock' size={14} style={{opacity: 0.3}}/>
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

function ChannelItem(props: { channel: Channel, selected: boolean }) {
  const { channel } = props;


  const hasNotifications = () => channel.hasNotifications;

  const isPrivateChannel = () => hasBit(props.channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);

  return (
    <Link
      href={RouterEndpoints.SERVER_MESSAGES(channel.serverId!, channel.id)}
      style={{ "text-decoration": "none" }}
    >
      <ChannelContainer selected={props.selected} alert={hasNotifications()}>
        <Text class="channelIcon">#</Text>
        <Show when={isPrivateChannel()}>
          <Icon name='lock' size={14} style={{opacity: 0.3, "margin-right": "5px"}}/>
        </Show>
        <Text class="label">{channel.name}</Text>
      </ChannelContainer>
    </Link>
  )
}


export default ServerDrawer;