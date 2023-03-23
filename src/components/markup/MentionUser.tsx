import { RawUser } from "@/chat-api/RawData";
import { avatarUrl, User } from "@/chat-api/store/useUsers";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "../ui/Avatar";
import { CustomLink } from "../ui/CustomLink";

export function MentionUser(props: {user: RawUser}) {

  return (
    <CustomLink 
    href={RouterEndpoints.PROFILE(props.user.id)} 
    class="mention">
      <Avatar class="avatar" user={props.user} size={16} />
      {props.user.username}
    </CustomLink>
  )
}