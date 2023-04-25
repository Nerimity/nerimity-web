import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import { Link, useNavigate, useParams } from '@nerimity/solid-router';
import { createEffect, createMemo, createSignal, For, on, onMount } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Button from '@/components/ui/Button';
import { Channel } from '@/chat-api/store/useChannels';
import Icon from '@/components/ui/icon/Icon';
import { createServerChannel, updateServerChannelOrder } from '@/chat-api/services/ServerService';
import { useTransContext } from '@nerimity/solid-i18next';
import Sortable from 'solid-sortablejs';



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
  const sortedServerChannels = createMemo(() => channels.getSortedChannelsByServerId(serverId));

  const [temp, setTemp, resetTemp] = createTemporarySignal(sortedServerChannels);

  const setItems = async (newItems: Channel[]) => {
    setTemp(newItems);
    const updateOrder = newItems.map((newItem, i) => ({id:  newItem.id, order: i + 1}))
    const diff = updateOrder.filter((newItem, i) => sortedServerChannels()[i]?.id !== newItem.id);
    if (!diff.length) return;
    await updateServerChannelOrder(serverId, diff).finally(() => {
      resetTemp()
    })
  }

  return (
    <Sortable class={styles.channelList}  setItems={setItems} items={temp() as unknown as Channel[]} idField="id">
      {channel => <ChannelItem channel={channel!} />}
    </Sortable>
  )
}

function createTemporarySignal<T>(v: () => T) {
  const [value, setValue] = createSignal(v()); 
  createEffect(on(v, () => setValue(v)))

  const resetValue = () => setValue(v);

  return [value, setValue, resetValue] as const
}


export default function ServerSettingsChannel() {
  const [t] = useTransContext();
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
      <SettingsBlock label={t('servers.settings.channels.addNewChannel')} icon='add'>
        <Button label={t('servers.settings.channels.addChannelButton')} onClick={onAddChannelClicked} />
      </SettingsBlock>
      <ChannelList />
    </div>
  )
}

