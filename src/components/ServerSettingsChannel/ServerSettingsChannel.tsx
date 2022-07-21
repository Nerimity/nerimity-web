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
import CustomButton from '../CustomButton';
import { createUpdatedSignal } from '../../common/createUpdatedSignal';
import { updateServerSettings } from '../../chat-api/services/ServerService';



export default function ServerSettingsChannel() {
  const params = useParams();
  const { tabs } = useStore();



  
  createEffect(() => {
    console.log("test")
    tabs.updateTab(location.pathname, {
      title: "Settings - Channel",
      serverId: params.serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_CHANNEL(params.serverId!, params.id),
    });
  })




  return (
    <div>
      Test
    </div>
  )
}

