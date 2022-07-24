import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import { useParams } from 'solid-app-router';
import { onMount} from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import SettingsBlock from '@/components/ui/settings-block';
import Button from '@/components/ui/button';



export default function ServerSettingsChannel() {
  const {serverId} = useParams();
  const { tabs } = useStore();


  onMount(() => {
    tabs.openTab({
      title: "Settings - Channels",
      serverId: serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_CHANNELS(serverId!),
    });
  })


  return (
    <div class={styles.channelsPane}>
      <div class={styles.title}>Channels</div>
      <SettingsBlock label='Add a new channel' icon='add'>
        <Button label='Add Channel' />
      </SettingsBlock>
    </div>
  )
}

