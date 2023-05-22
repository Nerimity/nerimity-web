import { RawUser } from "@/chat-api/RawData";
import { avatarUrl, User } from "@/chat-api/store/useUsers";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "../ui/Avatar";
import { CustomLink } from "../ui/CustomLink";
import { createSignal, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import MemberContextMenu from "../member-context-menu/MemberContextMenu";

export function MentionUser(props: { user: RawUser }) {
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>(undefined);
  const params = useParams<{ serverId?: string }>();
  const onContext = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation();
    setContextPosition({ x: event.clientX, y: event.clientY });
  }

  return (
    <CustomLink
      onContextMenu={onContext}
      href={RouterEndpoints.PROFILE(props.user.id)}
      class="mention">
      <Avatar class="avatar" user={props.user} size={16} />
      {props.user.username}
      <Show when={contextPosition()}>
        <MemberContextMenu user={props.user} position={contextPosition()} serverId={params.serverId} userId={props.user.id} onClose={() => setContextPosition(undefined)} />
      </Show>
    </CustomLink>
  )
}