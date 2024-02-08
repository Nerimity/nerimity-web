import { Channel } from "@/chat-api/store/useChannels";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CustomLink } from "../ui/CustomLink";

export function MentionChannel(props: {channel: Channel}) {

  return (
    <CustomLink 
      href={RouterEndpoints.SERVER_MESSAGES(props.channel.serverId!, props.channel.id)} 
      class="mention">
      <span class="type">#</span>{props.channel.name}
    </CustomLink>
  );
}