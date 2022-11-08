
import styles from './styles.module.scss';
import { Link, useParams } from '@nerimity/solid-router';
import { Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Avatar from '@/components/ui/avatar/Avatar';
import RouterEndpoints from '@/common/RouterEndpoints';


const ServerSettingsHeader = () => {
  const params = useParams();
  const {servers, serverMembers} = useStore();

  const server = () => servers.get(params.serverId!);

  const serverMembersCount = () => serverMembers.array(params.serverId!).length;



  return (
    <Show when={server()}>
      <div class={styles.header} style={{background: server()?.hexColor}}>
        <Avatar hexColor={server()!.hexColor} size={80} class={styles.avatar} />
        <div class={styles.details}>
          <div class={styles.title}>{server()!.name}</div>
          <div class={styles.members}>{serverMembersCount()} members</div>
          <Link href={RouterEndpoints.SERVER_SETTINGS_GENERAL(server()!.id)} class={styles.link} >Edit Server</Link>
        </div>
      </div>
    </Show>
  )
};


export default ServerSettingsHeader;