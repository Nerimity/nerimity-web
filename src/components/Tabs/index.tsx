import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import Avatar from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { Link, useLocation } from '@solidjs/router';
import { For } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { Tab } from '@/chat-api/store/useTabs';
import UserPresence from '@/components/user-presence';

const TabList = () => {
  const {tabs} = useStore();
  return (
    <div class={styles.tabs}>
      <For each={tabs.array}>
        {tab => <TabItem tab={tab} />}
      </For>
    </div>
  )
}

export default TabList;
const TabItem = (props: {tab: Tab}) => {
  const location = useLocation();
  const {servers, users, tabs} = useStore();
  const server = () => servers.get(props.tab.serverId!);
  const user = () => users.get(props.tab.userId!);


  const onDoubleClick = () => {
    tabs.updateTab(props.tab.path, {isPreview: false})
  }


  const selected = () => {
    return location.pathname === props.tab.path;
  };

  const details = () => {
    let subName = null;
    let title = null;
    if (server()) {
      subName = server()?.name;
    }
    if (user()) {
      title = user().username;
    }
  
    if (props.tab.title) {
      title = props.tab.title;
    }
  
    if (props.tab.subName) {
      subName = props.tab.subName;
    }
    return {subName, title};
  }

  const onCloseClick = (event: MouseEvent) => {
    event.preventDefault();
    tabs.closeTab(props.tab.path);
  }

  

  return (
    <Link href={props.tab.path} class={classNames(styles.tab, conditionalClass(!props.tab.isPreview, styles.opened), conditionalClass(selected(), styles.selected))} onDblClick={onDoubleClick}>
      {props.tab.iconName && <Icon name={props.tab.iconName} class={classNames(styles.icon, conditionalClass(server() || user(), styles.hasAvatar))} />}
      {server() && <Avatar size={25} hexColor={server()!?.hexColor} />}
      {user() && <Avatar size={25} hexColor={user().hexColor} />}
      <div class={styles.details}>
        <div class={styles.title}>{details().title}</div>
        {details().subName && <div class={styles.subTitle}>{details().subName}</div>}
        {user() && <UserPresence userId={user()?.id} showOffline={true} />}
      </div>
      <Icon name="close" size={14} class={styles.closeIcon} onClick={onCloseClick} />
    </Link>
  )
}