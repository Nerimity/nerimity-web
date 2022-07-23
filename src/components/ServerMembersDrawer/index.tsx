import styles from './styles.module.scss';
import Avatar from "../Avatar";
import UserPresence from '../UserPresence';
import { useParams } from 'solid-app-router';
import useStore from '../../chat-api/store/useStore';
import { For } from 'solid-js';
import { ServerMember } from '../../chat-api/store/useServerMembers';


const MemberItem = (props: {member: ServerMember}) => {
  const {users} = useStore();
  const user = () => users.get(props.member.user); 

  return (
    <div class={styles.memberItem}>
      <Avatar size={25} hexColor={user().hexColor} />
      <div class={styles.memberInfo}>
        <div class={styles.username}>{user().username}</div>
        <UserPresence userId={user()._id} showOffline={false} />
      </div>
    </div>
  )
};



const ServerMembersDrawer = () => {
  const params = useParams();
  const {servers, serverMembers} = useStore();
  const server = () => servers.get(params.serverId!);
  const members = () => serverMembers.array(server()?._id) || [];

  return <div class={styles.membersList}>
    <For each={members()}>
      {member => <MemberItem  member={member} />}
    </For>
  </div>
};

export default ServerMembersDrawer;