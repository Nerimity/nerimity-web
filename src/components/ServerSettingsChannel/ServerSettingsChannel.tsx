import styles from './styles.module.scss';
import RouterEndpoints from '../../common/RouterEndpoints';
import { useParams } from 'solid-app-router';
import { createEffect,  on,} from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { createUpdatedSignal } from '../../common/createUpdatedSignal';
import SettingsBlock from '../SettingsBlock';
import CustomInput from '../CustomInput';



export default function ServerSettingsChannel() {
  const {serverId, id: channelId} = useParams();
  const { tabs, channels } = useStore();

  const channel = () => channels.get(channelId);


  const defaultInput = () => ({
    name: channel()?.name || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);



  
  createEffect(on(channel, () => {
    tabs.openTab({
      title: "Settings - " + channel().name,
      serverId: serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_CHANNEL(serverId!, channelId),
    });
  }))


  return (
    <div class={styles.channelPane}>
      <SettingsBlock icon='edit' label='Channel Name'>
        <CustomInput value={inputValues().name} onText={(v) => setInputValue('name', v) } />
      </SettingsBlock>
    </div>
  )
}

