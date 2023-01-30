import { RawUser } from "@/chat-api/RawData";
import { User } from "@/chat-api/store/useUsers";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "../ui/Avatar";
import { CustomLink } from "../ui/CustomLink";

export function MentionUser(props: {user: RawUser}) {

  return (
    <CustomLink 
    href={RouterEndpoints.PROFILE(props.user.id)} 
    class="mention">
      <Avatar class="avatar" hexColor={props.user.hexColor} size={16} />
      {props.user.username}
    </CustomLink>
  )
}