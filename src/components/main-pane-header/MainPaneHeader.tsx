import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/icon/Icon';
import useStore from '@/chat-api/store/useStore';
import UserPresence from '@/components/user-presence/UserPresence';
import { useDrawer } from '../ui/drawer/Drawer';
import { createSignal, Show } from 'solid-js';
import { useWindowProperties } from '@/common/useWindowProperties';




export default function MainPaneHeader() {
  const { servers, users, header } = useStore();
  const { toggleLeftDrawer, toggleRightDrawer, hasRightDrawer, currentPage } = useDrawer();
  const { isMobileWidth } = useWindowProperties();
  const [hovered, setHovered] = createSignal(false);

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
    return { subName, title };
  }



  return (
    <div onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)} class={classNames(styles.header, conditionalClass(isMobileWidth(), styles.isMobile))}>
      <Show when={isMobileWidth()}>
        <div class={styles.drawerIcon} onClick={toggleLeftDrawer}><Icon name='menu' /></div>
      </Show>
      {header.details().iconName && <Icon name={header.details().iconName} class={classNames(styles.icon, conditionalClass(server() || user(), styles.hasAvatar))} />}
      {server() && <Avatar animate={hovered()} size={25} server={server()} />}
      {user() && <Avatar animate={hovered()} size={25} user={user()} />}
      <div class={styles.details}>
        <div class={styles.title}>{details().title}</div>
        {details().subName && <div class={styles.subTitle}>{details().subName}</div>}
        {user() && <UserPresence userId={user()?.id} showOffline={true} animate={hovered()} />}
      </div>
      <div class={styles.rightIcons}>
        <Show when={header.details().channelId}>
          <div class={classNames(styles.drawerIcon, styles.right)} onClick={toggleRightDrawer}><Icon name='call' /></div>
        </Show>
        <Show when={hasRightDrawer() && isMobileWidth()}>
          <div class={styles.drawerIcon} onClick={toggleRightDrawer}><Icon name='group' /></div>
        </Show>
      </div>
    </div>
  )
}