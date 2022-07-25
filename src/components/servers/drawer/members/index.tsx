import styles from './styles.module.scss';
import Avatar from "@/components/ui/avatar";
import UserPresence from '@/components/user-presence';
import { useParams } from 'solid-app-router';
import useStore from '@/chat-api/store/useStore';
import { For } from 'solid-js';
import { ServerMember } from '@/chat-api/store/useServerMembers';
import { UserStatus } from '@/chat-api/store/useUsers';


const MemberItem = (props: {member: ServerMember}) => {
  const user = () => props.member.user; 

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
  
  const members = () => useCategorizedMembers(server()?._id)

  return <div class={styles.membersList}>
    Online
    <For each={members().onlineMembers()}>
      {member => <MemberItem  member={member} />}
    </For>
    Offline
    <For each={members().offlineMembers()}>
      {member => <MemberItem  member={member} />}
    </For>
  </div>
};



function useCategorizedMembers(serverId: string) {
  const {servers, serverMembers} = useStore();
  const server = () => servers.get(serverId!);
  const members = () => serverMembers.array(server()?._id) || [];

  const onlineMembers = () => members().filter(member => member.user.presence?.status);
  const offlineMembers = () => members().filter(member => !member.user.presence?.status);

  return {onlineMembers, offlineMembers};
}

export default ServerMembersDrawer;