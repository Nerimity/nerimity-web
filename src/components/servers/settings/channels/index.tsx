import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import { Link, useNavigate, useParams } from '@solidjs/router';
import { createSignal, For, onMount } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import SettingsBlock from '@/components/ui/settings-block';
import Button from '@/components/ui/button';
import { Channel } from '@/chat-api/store/useChannels';
import Icon from '@/components/ui/icon';
import { createServerChannel } from '@/chat-api/services/ServerService';



function ChannelItem(props: { channel: Channel }) {
  const { serverId } = useParams();

  const link = RouterEndpoints.SERVER_SETTINGS_CHANNEL(serverId, props.channel.id);

  return (
    <Link href={link} class={styles.channelItem}>
      <Icon name='storage' size={18} />
      <div class={styles.name}>{props.channel.name}</div>
      <Icon name='navigate_next' />
    </Link>
  )
}


function ChannelList() {
  const { serverId } = useParams();
  const { channels } = useStore();
  const serverChannels = () => channels.getChannelsByServerId(serverId)

  return (
    <div class={styles.channelList}>
      <For each={serverChannels()}>
        {channel => <ChannelItem channel={channel!} />}
      </For>
    </div>
  )
}




export default function ServerSettingsChannel() {
  const { serverId } = useParams();
  const { header } = useStore();
  const [channelAddRequestSent, setChannelAddRequestSent] = createSignal(false);
  const navigate = useNavigate();
  
  onMount(() => {
    header.updateHeader({
      title: "Settings - Channels",
      serverId: serverId!,
      iconName: 'settings'
    });
  })

  const onAddChannelClicked = async () => {
    if (channelAddRequestSent()) return;
    setChannelAddRequestSent(true);

    const channel = await createServerChannel(serverId!)
      .finally(() => setChannelAddRequestSent(false))

    navigate(RouterEndpoints.SERVER_SETTINGS_CHANNEL(serverId!, channel.id))
  }


  return (
    <div class={styles.channelsPane}>
      <div class={styles.title}>Channels</div>
      <SettingsBlock label='Add a new channel' icon='add'>
        <Button label='Add Channel' onClick={onAddChannelClicked} />
      </SettingsBlock>
      <ChannelList />
    </div>
  )
}

