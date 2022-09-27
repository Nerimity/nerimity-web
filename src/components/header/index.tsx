import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import Avatar from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import useStore from '@/chat-api/store/useStore';
import UserPresence from '@/components/user-presence';




export default function Header() {
  const {servers, users, header} = useStore();

  const headerDetails = () => header.details

  const server = () => servers.get(headerDetails().serverId!);
  const user = () => users.get(headerDetails().userId!);

  const details = () => {
    let subName = null;
    let title = null;
    if (server()) {
      subName = server()?.name;
    }
    if (user()) {
      title = user().username;
    }
  
    if (headerDetails().title) {
      title = headerDetails().title;
    }
  
    if (headerDetails().subName) {
      subName = headerDetails().subName;
    }
    return {subName, title};
  }

  return (
    <div class={styles.header}>
      {headerDetails().iconName && <Icon name={headerDetails().iconName} class={classNames(styles.icon, conditionalClass(server() || user(), styles.hasAvatar))} />}
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