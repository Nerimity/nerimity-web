import { Message } from "@/chat-api/store/useMessages";
import Avatar from "../ui/Avatar";
import { Markup } from "../Markup";
import useStore from "@/chat-api/store/useStore";
import { useParams } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { CustomLink } from "../ui/CustomLink";
import { Show, createSignal } from "solid-js";
import Icon from "../ui/icon/Icon";
import Button from "../ui/Button";
import socketClient from "@/chat-api/socketClient";
import { ServerEvents } from "@/chat-api/EventNames";
import { formatTimestamp } from "@/common/date";
import {
  emitModerationShowMessages,
  emitScrollToMessage,
} from "@/common/GlobalEvents";
import { Embeds } from "../message-pane/message-item/MessageItem";

export function QuoteMessage(props: {
  message: Message;
  quote: Partial<Message>;
}) {
  const [hovered, setHovered] = createSignal(false);
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const { serverMembers, messages, channels } = useStore();
  
  const getOrigin = () => {
    const channel = channels.get(props.quote.channelId || "");
    return {
      channel,
      serverId: channel?.serverId || params.serverId,
      channelId: props.quote.channelId
    };
  };

  const serverMember = () => {
    const { serverId } = getOrigin();
    return serverId
      ? serverMembers.get(serverId, props.quote.createdBy!.id)
      : undefined;
  };

  socketClient.useSocketOn(ServerEvents.MESSAGE_DELETED, onDelete);
  socketClient.useSocketOn(ServerEvents.MESSAGE_UPDATED, onUpdate);

  function onDelete(payload: { channelId: string; messageId: string }) {
    if (props.quote.id !== payload.messageId) return;

    messages.updateLocalMessage(
      {
        quotedMessages: props.message.quotedMessages.filter(
          (m) => m.id !== props.quote.id
        ),
      },
      props.message.channelId,
      props.message.id
    );
  }

  function onUpdate(payload: {
    channelId: string;
    messageId: string;
    updated: Message;
  }) {
    if (props.quote.id !== payload.messageId) return;

    const quotedMessages = [...props.message.quotedMessages];
    const index = quotedMessages.findIndex((q) => q.id === props.quote.id);
    quotedMessages[index] = { ...quotedMessages[index], ...payload.updated };
    messages.updateLocalMessage(
      {
        quotedMessages,
      },
      props.message.channelId,
      props.message.id
    );
  }

  const editedAt = () => {
    if (!props.quote.editedAt) return;
    return "Edited at " + formatTimestamp(props.quote.editedAt);
  };

  const jumpToLink = () => {
    const { serverId, channelId } = getOrigin();
    const mId = props.quote.id;

    if (!channelId || !mId) return "#";
    if (!serverId) {
      return `/app/direct-messages/${channelId}?messageId=${mId}`;
    }

    return `/app/servers/${serverId}/${channelId}?messageId=${mId}`;
  };

  return (
    <div
      class="quoteContainer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div class="headerContainer">
        <CustomLink
          decoration
          href={
            props.quote.webhookId
              ? "#"
              : RouterEndpoints.PROFILE(props.quote.createdBy!.id)
          }
          style={{ color: serverMember()?.roleColor() }}
        >
          <Avatar animate={hovered()} user={props.quote.createdBy!} size={18} />
        </CustomLink>
        <CustomLink
          decoration
          href={
            props.quote.webhookId
              ? "#"
              : RouterEndpoints.PROFILE(props.quote.createdBy!.id)
          }
          style={{
            "font-size": "16px",
            color: serverMember()?.roleColor(),
            "line-height": "1",
          }}
        >
          {serverMember()?.nickname || props.quote.createdBy!.username}
        </CustomLink>
        <Show when={getOrigin().channel}>
          <Show
            when={props.quote.channelId === params.channelId}
            fallback={
              <CustomLink href={jumpToLink()}>
                <Button
                  class="goToMessageButton"
                  iconName="keyboard_arrow_up"
                  margin={0}
                  padding={4}
                  iconSize={14}
                />
              </CustomLink>
            }
          >
            <Button
              class="goToMessageButton"
              iconName="keyboard_arrow_up"
              margin={0}
              padding={4}
              iconSize={14}
              onClick={() => {
                emitScrollToMessage({ messageId: props.quote.id! });
              }}
            />
          </Show>
        </Show>
        <Button
          class="goToMessageButton modShowMessagesButton"
          iconName="visibility"
          padding={4}
          iconSize={14}
          title="View Messages"
          onClick={() =>
            emitModerationShowMessages({
              messageId: props.quote.id!,
              channelId: props.quote.id!,
            })
          }
        />
      </div>
      <div>
        <Markup
          replaceCommandBotId
          text={props.quote.content || ""}
          message={props.quote as Message}
          isQuote
        />
        <Show when={editedAt()}>
          <Icon
            class="editIcon"
            name="edit"
            size={14}
            color="rgba(255,255,255,0.4)"
            title={editedAt()}
          />
        </Show>
      </div>
      <Embeds
        hovered={hovered()}
        message={props.quote}
        maxWidth={160}
        maxHeight={160}
      />
    </div>
  );
}

export function QuoteMessageInvalid() {
  return <div class="quoteContainer">Deleted Or Invalid Quote.</div>;
}

export function QuoteMessageHidden() {
  return <span class="hiddenQuote">Nested Quote</span>;
}
