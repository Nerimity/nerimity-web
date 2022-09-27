import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import Avatar from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { Link, useLocation } from '@solidjs/router';
import { For } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { Tab } from '@/chat-api/store/useTabs';
import UserPresence from '@/components/user-presence';




export default function Header() {
  const {servers, users, header} = useStore();
  const server = () => servers.get(props.header.serverId!);
  const user = () => users.get(props.header.userId!);

  const details = () => {
    let subName = null;
    let title = null;
    if (server()) {
      subName = server()?.name;
    }
    if (user()) {
      title = user().username;
    }
  
    if (props.header.title) {
      title = props.header.title;
    }
  
    if (props.header.subName) {
      subName = props.header.subName;
    }
    return {subName, title};
  }

  return (
    <div class={styles.tab}>
      {props.header.iconName && <Icon name={props.header.iconName} class={classNames(styles.icon, conditionalClass(server() || user(), styles.hasAvatar))} />}
      {server() && <Avatar size={25} hexColor={server()!?.hexColor} />}
      {user() && <Avatar size={25} hexColor={user().hexColor} />}
      <div class={styles.details}>
        <div class={styles.title}>{details().title}</div>
        {details().subName && <div class={styles.subTitle}>{details().subName}</div>}
        {user() && <UserPresence userId={user()?.id} showOffline={true} />}
      </div>
    </div>
  )
}