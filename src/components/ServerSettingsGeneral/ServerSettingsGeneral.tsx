import styles from './styles.module.scss'
import RouterEndpoints from '../../common/RouterEndpoints';
import env from '../../common/env';
import { classNames, conditionalClass } from '../../common/classNames';
import { useParams } from 'solid-app-router';
import { createEffect, createSignal, For } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { useWindowProperties } from '../../common/useWindowProperties';
import CustomInput from '../CustomInput';
import DropDown from '../DropDown';

export default function ServerSettingsInvite() {
  const {serverId} = useParams();
  const {tabs, servers, channels} = useStore();
  const windowProperties = useWindowProperties();
  const [mobileSize, isMobileSize] = createSignal(false);

  const server = () => servers.get(serverId);

  const dropDownChannels = () => channels.getChannelsByServerId(serverId).map(channel => ({
    id: channel._id,
    label: channel.name,
  }));
  


  const [inputFields, setInputFields] = createSignal({
    name: '',
  })

  createEffect(() => {
    setInputFields({
      name: server()?.name || '',
    })
  })

  createEffect(() => {
    const isMobile = windowProperties.paneWidth()! < env.MOBILE_WIDTH;
    isMobileSize(isMobile);
  })
  
  
  createEffect(() => {
    tabs.openTab({
      title: "Settings - General",
      serverId: serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_GENERAL(serverId!),
    });
  })


  return (
    <div class={classNames(styles.generalPane, conditionalClass(mobileSize(), styles.mobile))}>
      <div class={styles.title}>Server General</div>

      <div class={styles.form}>
        <CustomInput label='Server Name' value={inputFields().name} onText={(v) => setInputFields({...inputFields(), name: v}) } />
        <DropDown title='Default Channel' items={dropDownChannels()} selectedId={server()?.defaultChannel} />
      </div>

    </div>
  )
}


