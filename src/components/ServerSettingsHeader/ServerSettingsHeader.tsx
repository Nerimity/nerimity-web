
import styles from './styles.module.scss';
import { Link, useParams } from 'solid-app-router';
import { Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import Avatar from '../Avatar/Avatar';


const ServerSettingsHeader = () => {
  const params = useParams();
  const {servers, serverMembers} = useStore();

  const server = () => servers.get(params.serverId!);

  const serverMembersCount = () => serverMembers.array(params.serverId!).length;



  return (
    <Show when={server()}>
      <div class={styles.header}>
        <Avatar hexColor={server().hexColor} size={80} />
        <div class={styles.details}>
          <div class={styles.title}>{server().name}</div>
          <div class={styles.members}>{serverMembersCount()} members</div>
          <Link href="#" class={styles.link} >Rename</Link>
        </div>
      </div>
    </Show>
  )
};


export default ServerSettingsHeader;