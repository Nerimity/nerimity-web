import { RawUser } from "@/chat-api/RawData";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "../ui/Avatar";
import { createSignal, Show } from "solid-js";
import { A, useParams } from "solid-navigator";
import MemberContextMenu from "../member-context-menu/MemberContextMenu";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { ProfileFlyout } from "../floating-profile/FloatingProfile";
import useServerMembers, { ServerMember } from "@/chat-api/store/useServerMembers";

export function MentionUser(props: { user: RawUser, serverMember?: ServerMember }) {
  const serverMembers = useServerMembers();
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>(undefined);
  const { createPortal } = useCustomPortal();

  const params = useParams<{ serverId?: string }>();


  const serverMember = () => params.serverId ? serverMembers.get(params.serverId, props.user.id) : undefined;


  const onContext = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const showProfileFlyout = (event: MouseEvent) => {
    event.preventDefault();
    const el = event.target as HTMLElement;
    const rect = el?.getBoundingClientRect()!;
    const pos = { left: rect.left + 40, top: rect.top, anchor: "left" } as const;
    return createPortal(close => <ProfileFlyout triggerEl={el} position={pos} serverId={params.serverId} close={close} userId={props.user.id} />, "profile-pane-flyout-" + props.user.id, true);
  };


  return (
    <>
      <A
        onClick={showProfileFlyout}
        onContextMenu={onContext}
        href={RouterEndpoints.PROFILE(props.user.id)}
        class="mention trigger-profile-flyout">
        <Avatar class="avatar" user={props.user} size={16} />
        {serverMember()?.nickname || props.user.username}
      </A>
      <Show when={contextPosition()}>
        <MemberContextMenu user={props.user} position={contextPosition()} serverId={params.serverId} userId={props.user.id} onClose={() => setContextPosition(undefined)} />
      </Show>
    </>
  );
}