import styles from './styles.module.scss'
import RouterEndpoints from '../../common/RouterEndpoints';
import { createInvite, getInvites} from '../../chat-api/services/ServerService';
import Avatar from '../Avatar/Avatar';
import CustomButton from '../CustomButton/CustomButton';
import env from '../../common/env';
import { classNames, conditionalClass } from '../../common/classNames';
import { formatTimestamp } from '../../common/date';
import { Icon } from '../Icon/Icon';
import { Link, useParams } from 'solid-app-router';
import { createEffect, createSignal, For } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { useWindowProperties } from '../../common/useWindowProperties';

export default function ServerSettingsInvite() {
  const params = useParams();
  const {tabs} = useStore();
  const windowProperties = useWindowProperties();
  const [mobileSize, isMobileSize] = createSignal(false);


  createEffect(() => {
    const isMobile = windowProperties.paneWidth()! < env.MOBILE_WIDTH;
    isMobileSize(isMobile);
  })
  
  
  createEffect(() => {
    tabs.openTab({
      title: "Settings - General",
      serverId: params.serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_GENERAL(params.serverId!),
    });
  })


  return (
    <div class={classNames(styles.generalPane, conditionalClass(mobileSize(), styles.mobile))}>
      <div class={styles.title}>Server General</div>
    </div>
  )
}


