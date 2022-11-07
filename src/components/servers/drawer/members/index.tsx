import styles from './styles.module.scss';
import Avatar from "@/components/ui/avatar";
import UserPresence from '@/components/user-presence';
import { useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { createMemo, createSignal, For, mapArray, Show } from 'solid-js';
import { ServerMember } from '@/chat-api/store/useServerMembers';
import MemberContextMenu from '../../../member-context-menu';

const MemberItem = (props: {member: ServerMember}) => {
  const user = () => props.member.user; 
  const [contextPosition, setContextPosition] = createSignal<{x: number, y: number} | undefined>(undefined);


  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextPosition({x: event.clientX, y: event.clientY});
  }

  return (
    <div class={styles.memberItem} oncontextmenu={onContextMenu} >
      <MemberContextMenu position={contextPosition()} serverId={props.member.serverId} userId={props.member.userId} onClose={() => setContextPosition(undefined)} />
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
  const {servers, serverMembers, serverRoles} = useStore();
  const server = () => servers.get(params.serverId!);
  

  const roles = () => serverRoles.getAllByServerId(params.serverId);

  const members = () => serverMembers.array(params.serverId);

  const roleMembers = mapArray(roles, role => {

    const membersInThisRole = () => members().filter(member => {
      if (!member?.user.presence?.status) return false;
      if (server()?.defaultRoleId === role!.id && !member?.unhiddenRole()) return true;
      if (member?.unhiddenRole()?.id === role!.id) return true;
    });

    return {role, members: createMemo(() => membersInThisRole())}
  })

  const offlineMembers = createMemo(() => members().filter(member => !member?.user.presence?.status))


  return (
    <div class={styles.membersList}>

    <For each={roleMembers()}>
      {item => (
        <Show when={!item.role!.hideRole && item.members().length}>
          <div class={styles.roleItem}>
            <div class={styles.roleName}>{item.role!.name} ({item.members().length})</div>
            <For each={item.members()}>
              {member => <MemberItem  member={member!} />}
            </For>
          </div>
        </Show>
      )}
    </For>

    {/* Offline */}
    <div class={styles.roleItem}>
      <div class={styles.roleName}>Offline ({offlineMembers().length})</div>
      <For each={offlineMembers()}>
        {member => <MemberItem  member={member!} />}
      </For>
    </div>
  </div>
  )
};



export default ServerMembersDrawer;