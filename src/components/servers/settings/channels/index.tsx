import RouterEndpoints from '@/common/RouterEndpoints';
import { useLocation, useParams } from 'solid-app-router';
import { onMount} from 'solid-js';
import useStore from '@/chat-api/store/useStore';




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
    <div>
      Channels
    </div>
  )
}

