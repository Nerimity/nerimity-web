import styles from './styles.module.scss';

import { classNames, conditionalClass } from '@/common/classNames';
import RouterEndpoints from '@/common/RouterEndpoints';
import Header from './header/ServerDrawerHeader';
import { Link, useParams } from '@nerimity/solid-router';
import useStore from '@/chat-api/store/useStore';
import { For } from 'solid-js';
import { Channel } from '@/chat-api/store/useChannels';
import ItemContainer from '@/components/ui/Item';
import { styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';


const ChannelContainer = styled(ItemContainer)`
  height: 32px;
  padding-left: 10px;
  margin-left: 3px;
  margin-right: 3px;

  
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

`;

const ServerDrawer = () => {
  return (
    <div class={styles.serverDrawer}>
      <ChannelList />
    </div>
  )
};



const ChannelList = () => {
  const params = useParams();
  const {channels} = useStore();
  const sortedServerChannels = () => channels.getSortedChannelsByServerId(params.serverId);



  return (
    <div class={styles.channelList}>
      <Header />
      <For each={sortedServerChannels()}>
        {channel => (
          <ChannelItem channel={channel!} selected={params.channelId === channel!.id} />
        )}
      </For>
    </div>
  )
};

function ChannelItem(props: {channel: Channel, selected: boolean}) {
  const { channel } = props;
  if (!channel.serverId) return null;

  const hasNotifications = () => channel.hasNotifications;


  return (
    <Link 
      href={RouterEndpoints.SERVER_MESSAGES(channel.serverId, channel.id)}
        style={{"text-decoration": "none"}}
      >
        <ChannelContainer selected={props.selected} alert={hasNotifications()}>
          <Text class="label">{channel.name}</Text>
        </ChannelContainer>
    </Link>
  )
}


export default ServerDrawer;