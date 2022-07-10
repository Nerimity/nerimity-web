import styles from './styles.module.scss'
import RouterEndpoints from '../../common/RouterEndpoints';
import env from '../../common/env';
import { classNames, conditionalClass } from '../../common/classNames';
import { useParams } from 'solid-app-router';
import { createEffect, createSignal, For } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { useWindowProperties } from '../../common/useWindowProperties';
import CustomInput from '../CustomInput';

export default function ServerSettingsInvite() {
  const {serverId} = useParams();
  const {tabs, account} = useStore();
  const windowProperties = useWindowProperties();
  const [mobileSize, isMobileSize] = createSignal(false);


  const [inputFields, setInputFields] = createSignal({
    username: '',
    tag: '',
  })

  createEffect(() => {
    setInputFields({
      username: account.user()?.username || '',
      tag: account.user()?.tag || '', 
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

      <div class={styles.usernameAndTag}>  
        <CustomInput label='Username' value={inputFields().username} onText={(v) => setInputFields({...inputFields(), username: v}) } connectRight={true}  />
        <CustomInput label='Tag' value={inputFields().tag} onText={(v) => setInputFields({...inputFields(), tag: v}) } connectLeft={true} class={styles.tagInput}  />
      </div>

    </div>
  )
}


