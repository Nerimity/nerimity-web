import { Message } from "@/chat-api/store/useMessages";
import Avatar from "../ui/Avatar";
import { Markup } from "../Markup";
import useStore from "@/chat-api/store/useStore";
import { useParams } from "@solidjs/router";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CustomLink } from "../ui/CustomLink";
import { Show, createSignal } from "solid-js";
import Icon from "../ui/icon/Icon";
import Button from "../ui/Button";






export function QuoteMessage(props: { message: Partial<Message> }) {
  const [hovered, setHovered] = createSignal(false);
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const { serverMembers, servers } = useStore();
  const serverMember = () => params.serverId ? serverMembers.get(params.serverId, props.message.createdBy!.id) : undefined;

  return (
    <div class="quoteContainer" onmouseenter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div class="headerContainer">
        <CustomLink decoration href={RouterEndpoints.PROFILE(props.message.createdBy!.id)} style={{ color: serverMember()?.roleColor() }}>
          <Avatar animate={hovered()} user={props.message.createdBy!} size={18} />
        </CustomLink>
        <CustomLink decoration href={RouterEndpoints.PROFILE(props.message.createdBy!.id)} style={{ "font-size": "16px", color: serverMember()?.roleColor() }}>
          {props.message.createdBy!.username}
        </CustomLink>
        {/* <Show when={props.message.channelId === params.channelId}>
          <Button class="goToMessageButton" iconName="keyboard_arrow_up" margin={0} padding={4} iconSize={14} />
        </Show> */}
      </div>
      <div>
        <Show when={props.message.attachments?.length}>
          <Icon style={{"vertical-align": "-0.2em", "margin-right": "4px"}} name="image" color="rgba(255,255,255,0.6)" size={16}/>
        </Show>
        <Markup text={props.message.content || ""} message={props.message as Message} isQuote />
        <Show when={props.message.attachments?.length && !props.message.content}>
          Image
        </Show>
      </div>

    </div>
  )
}


export function QuoteMessageInvalid() {
  return <div class="quoteContainer">Deleted Or Invalid Quote.</div>
}
export function QuoteMessageHidden() {
  return <span class="hiddenQuote">Nested Quote</span>
}