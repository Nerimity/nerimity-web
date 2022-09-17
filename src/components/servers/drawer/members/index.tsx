import styles from './styles.module.scss';
import Avatar from "@/components/ui/avatar";
import UserPresence from '@/components/user-presence';
import { useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { createSignal, For } from 'solid-js';
import { ServerMember } from '@/chat-api/store/useServerMembers';
import { UserStatus } from '@/chat-api/store/useUsers';
import ContextMenuServerMember from '../members/context-menu';

const MemberItem = (props: {member: ServerMember}) => {
  const user = () => props.member.user; 
  const [contextPosition, setContextPosition] = createSignal<{x: number, y: number} | undefined>(undefined);

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextPosition({x: event.clientX, y: event.clientY});
  }

  return (
    <div class={styles.memberItem} oncontextmenu={onContextMenu} >
      <ContextMenuServerMember position={contextPosition()} serverId={props.member.serverId} userId={props.member.userId} onClose={() => setContextPosition(undefined)} />
      <Avatar size={25} hexColor={user().hexColor} />
      <div class={styles.memberInfo}>
        <div class={styles.username} style={{color: props.member.roleColor()}} >{user().username}</div>
        <UserPresence userId={user().id} showOffline={false} />
      </div>
    </div>
  )
};



const ServerMembersDrawer = () => {
  const params = useParams();
  const {servers, serverMembers} = useStore();
  const server = () => servers.get(params.serverId!);
  
  const members = () => useCategorizedMembers(server()!?.id)

  return (
    <div class={styles.membersList}>
    Online
    <For each={members().onlineMembers()}>
      {member => <MemberItem  member={member!} />}
    </For>
    Offline
    <For each={members().offlineMembers()}>
      {member => <MemberItem  member={member!} />}
    </For>
  </div>
  )
};



function useCategorizedMembers(serverId: string) {
  const {servers, serverMembers} = useStore();
  const server = () => servers.get(serverId!);
  const members = () => serverMembers.array(server()!?.id) || [];

  const onlineMembers = () => members().filter(member => member!.user.presence?.status);
  const offlineMembers = () => members().filter(member => !member!.user.presence?.status);

  return {onlineMembers, offlineMembers};
}

export default ServerMembersDrawer;