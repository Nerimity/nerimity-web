import styles from './styles.module.scss';

import { classNames, conditionalClass } from '@/common/classNames';
import RouterEndpoints from '@/common/RouterEndpoints';
import Header from './header';
import { Link, useParams } from 'solid-named-router';
import useStore from '@/chat-api/store/useStore';
import { For } from 'solid-js';
import { Channel } from '@/chat-api/store/useChannels';

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
  const {channels} = useStore();
  const serverChannels = () => channels.getChannelsByServerId(params.serverId);
  return (
    <div class={styles.channelList}>
      <For each={serverChannels()}>
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
      to={RouterEndpoints.SERVER_MESSAGES(channel.serverId, channel.id)}
      class={classNames(styles.channel, conditionalClass(props.selected, styles.selected), conditionalClass(hasNotifications(), styles.hasNotifications))}>
      <div class={styles.channelName}>{channel.name}</div>
    </Link>
  )
}


export default ServerDrawer;