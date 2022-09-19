import styles from './styles.module.scss';
import Avatar from "@/components/ui/avatar";
import UserPresence from '@/components/user-presence';
import { useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { createEffect, createSignal, For, Show } from 'solid-js';
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
  const {servers, serverMembers, serverRoles} = useStore();
  const server = () => servers.get(params.serverId!);
  

  const roles = () => serverRoles.getAllByServerId(params.serverId);

  const members = () => serverMembers.array(params.serverId);


  return (
    <div class={styles.membersList}>

    <For each={roles()}>
      {role => (
        <Show when={!role.hideRole}>
          <div class={styles.roleItem}>
            <div class={styles.roleName}>{role.name}</div>
            <For each={members()}>
              {member => <Show when={ (server()?.defaultRoleId === role.id && !member?.unhiddenRole()) ||  member?.unhiddenRole()?.id === role.id}><MemberItem  member={member!} /></Show>}
            </For>
          </div>
        </Show>
      )}
    </For>

    {/* Online
    <For each={members().onlineMembers()}>
      {member => <MemberItem  member={member!} />}
    </For>
    Offline
    <For each={members().offlineMembers()}>
      {member => <MemberItem  member={member!} />}
    </For> */}
  </div>
  )
};



function useCategorizedMembers(serverId: string) {

  const {servers, serverMembers, serverRoles, users} = useStore();

  const roles = () => serverRoles.getAllByServerId(serverId);


  const server = () => servers.get(serverId!);

  const unconsumedMemberIds = serverMembers.array(serverId).map(member => member?.userId!);

  const roleMembers = roles()
    .filter(role => !role.hideRole)
    .map(role => {
      const memberIds = [...unconsumedMemberIds].filter(memberId => {
        if (!unconsumedMemberIds.includes(memberId)) return false;
        const member = serverMembers.get(serverId, memberId);
        if (!member?.roleIds.includes(role.id)) return false;
        if (!member.user.presence?.status) return false;
        unconsumedMemberIds.splice(unconsumedMemberIds.indexOf(memberId), 1);
        return true;
      })
      if (!memberIds.length) return [];
      return [
        { title: role.name, id: role.id, count: memberIds.length },
        ...memberIds,
      ];
    }).flat();

    const onlineMembers = [...unconsumedMemberIds].filter(memberId => {
      const user = users.get(memberId);
      if (!user.presence?.status) return;
      unconsumedMemberIds.splice(unconsumedMemberIds.indexOf(memberId), 1);
      return true;
    });

    const offlineMembers = unconsumedMemberIds;

  



}

export default ServerMembersDrawer;