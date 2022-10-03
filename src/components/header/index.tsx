import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import Avatar from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import useStore from '@/chat-api/store/useStore';
import UserPresence from '@/components/user-presence';
import { useDrawer } from '../ui/drawer';
import { Show } from 'solid-js';
import { useWindowProperties } from '@/common/useWindowProperties';




export default function Header() {
  const {servers, users, header} = useStore();
  const {toggleLeftDrawer, toggleRightDrawer, hasRightDrawer, currentPage} = useDrawer();
  const {isMobileWidth} = useWindowProperties();



  const server = () => servers.get(header.details().serverId!);
  const user = () => users.get(header.details().userId!);

  const details = () => {
    let subName = null;
    let title = null;
    if (server()) {
      subName = server()?.name;
    }
    if (user()) {
      title = user().username;
    }
  
    if (header.details().title) {
      title = header.details().title;
    }
  
    if (header.details().subName) {
      subName = header.details().subName;
    }
    return {subName, title};
  }

  

  return (
    <div class={classNames(styles.header, conditionalClass(isMobileWidth(), styles.isMobile))}>
      <Show when={isMobileWidth()}>
        <div class={styles.drawerIcon} onClick={toggleLeftDrawer}><Icon name='menu' /></div>
      </Show>
      {header.details().iconName && <Icon name={header.details().iconName} class={classNames(styles.icon, conditionalClass(server() || user(), styles.hasAvatar))} />}
      {server() && <Avatar size={25} hexColor={server()!?.hexColor} />}
      {user() && <Avatar size={25} hexColor={user().hexColor} />}
      <div class={styles.details}>
        <div class={styles.title}>{details().title}</div>
        {details().subName && <div class={styles.subTitle}>{details().subName}</div>}
        {user() && <UserPresence userId={user()?.id} showOffline={true} />}
      </div>
      <Show when={hasRightDrawer() && isMobileWidth()}>
        <div class={classNames(styles.drawerIcon, styles.right)} onClick={toggleRightDrawer}><Icon name='group' /></div>
      </Show>
    </div>
  )
}