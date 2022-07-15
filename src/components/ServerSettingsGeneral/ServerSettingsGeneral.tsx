import styles from './styles.module.scss'
import RouterEndpoints from '../../common/RouterEndpoints';
import env from '../../common/env';
import { classNames, conditionalClass } from '../../common/classNames';
import { useParams } from 'solid-app-router';
import { createEffect, createSignal, JSX, Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { useWindowProperties } from '../../common/useWindowProperties';
import CustomInput from '../CustomInput';
import DropDown from '../DropDown';
import Icon from '../Icon';
import { createStore, reconcile } from 'solid-js/store';
import CustomButton from '../CustomButton';
import { createUpdatedSignal } from '../../common/createUpdatedSignal';



export default function ServerSettingsInvite() {
  const {serverId} = useParams();
  const {tabs, servers, channels} = useStore();
  const windowProperties = useWindowProperties();
  const [mobileSize, isMobileSize] = createSignal(false);
  const [requestSent, setRequestSent] = createSignal(false);

  const server = () => servers.get(serverId);

  const defaultInput = () => ({
    name: server()?.name || '',
    defaultChannel: server()?.defaultChannel || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput());


  const dropDownChannels = () => channels.getChannelsByServerId(serverId).map(channel => ({
    id: channel._id,
    label: channel.name,
    onClick: () => {
      setInputValue('defaultChannel', channel._id);
    }
  }));


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



  const onSaveButtonClicked = () => {
    if (requestSent()) return;
    setRequestSent(true);
    console.log( updatedInputValues() )
  }

  return (
    <div class={classNames(styles.generalPane, conditionalClass(mobileSize(), styles.mobile))}>
      <div class={styles.title}>Server General</div>
      
      <Block icon='edit' label='Server Name'>
        <CustomInput value={inputValues().name} onText={(v) => setInputValue('name', v) } />
      </Block>
      <Block icon='tag' label='Default Channel' description='New members will be directed to this channel.'>
        <DropDown items={dropDownChannels()} selectedId={inputValues().defaultChannel} />
      </Block>

      <Show when={Object.keys(updatedInputValues()).length}>
        <CustomButton iconName='save' label='Save Changes' class={styles.saveButton} onClick={onSaveButtonClicked} />
      </Show>

    </div>
  )
}



interface BlockProps {
  label: string;
  icon: string;
  description?: string;
  children?: JSX.Element | undefined;
}




function Block(props: BlockProps) {
  return (
    <div class={styles.block}>
      <Icon name={props.icon} />
      <div class={styles.details}>
        <div class={styles.label}>{props.label}</div>
        <Show when={props.description}><div class={styles.description}>{props.description}</div></Show>
      </div>
      {props.children}
    </div>
  )
}


