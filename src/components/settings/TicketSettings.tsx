import {
  Accessor,
  createEffect,
  createSignal,
  For,
  onMount,
  Setter,
  Show,
} from "solid-js";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import {
  getCurrentLanguage,
  getLanguage,
  Language,
  languages,
  setCurrentLanguage,
} from "@/locales/languages";

import ItemContainer from "../ui/Item";
import twemoji from "twemoji";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import { useTransContext } from "@nerimity/solid-i18next";
import env from "@/common/env";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { Emoji } from "../markup/Emoji";
import { CustomLink } from "../ui/CustomLink";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import {
  RawMessage,
  RawTicket,
  TicketCategory,
  TicketStatus,
} from "@/chat-api/RawData";
import { getTicket, getTickets } from "@/chat-api/services/TicketService.ts";
import { formatTimestamp } from "@/common/date";
import { useWindowProperties } from "@/common/useWindowProperties";
import { A, Route, Router, Routes, useMatch, useParams } from "@solidjs/router";
import { Dynamic } from "solid-js/web";
import { fetchMessages, postMessage } from "@/chat-api/services/MessageService";
import Avatar from "../ui/Avatar";
import { Markup } from "../Markup";
import RouterEndpoints from "@/common/RouterEndpoints";
import Input from "../ui/input/Input";
import Button from "../ui/Button";
import { getModerationTicket } from "@/chat-api/services/ModerationService";
import TicketsPage, { TicketItem } from "../tickets/TicketsPage";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function TicketSettings() {
  const { header } = useStore();
  createEffect(() => {
    header.updateHeader({
      title: "Settings - Tickets",
      iconName: "settings",
    });
  });

  return (
    <Routes>
      <Route path="/" component={TicketsPage} />
      <Route path="/:id" component={TicketPage} />
    </Routes>
  );
}

export const TicketPage = () => {
  const params = useParams<{ id: string }>();

  const [ticket, setTicket] = createSignal<RawTicket | null>(null);
  const [messages, setMessages] = createSignal<RawMessage[]>([]);

  const isModeration = useMatch(() => "/app/moderation/*");

  onMount(async () => {
    const ticket = await (isModeration() ? getModerationTicket : getTicket)(
      params.id
    );
    setTicket(ticket);
    if (!ticket) return;

    const messages = await fetchMessages(ticket.channelId, {
      afterMessageId: "0",
    });
    setMessages(messages);
  });

  return (
    <Container>
      <div
        class={
          isModeration()
            ? css`
                margin-top: 20px;
              `
            : ""
        }
      >
        <Breadcrumb>
          <Show when={isModeration()}>
            <BreadcrumbItem href={"../"} icon="home" title="Moderation" />
          </Show>
          <Show when={!isModeration()}>
            <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
          </Show>
          <BreadcrumbItem title={t("settings.drawer.tickets")!} href="../" />
          <BreadcrumbItem title={"Ticket"} />
        </Breadcrumb>
      </div>
      <Show when={ticket()}>
        <TicketItem
          as={isModeration() ? "mod" : "user"}
          ticket={ticket()!}
          disableClick={true}
        />
        <MessageLogs messages={messages()} />
        <MessageInputArea
          channelId={ticket()!.channelId}
          setMessages={setMessages}
          messages={messages()}
        />
      </Show>
    </Container>
  );
};

const MessageInputArea = (props: {
  channelId: string;
  messages: RawMessage[];
  setMessages: Setter<RawMessage[]>;
}) => {
  const [value, setValue] = createSignal("");

  const sendClick = async () => {
    const formattedValue = value().trim();
    setValue("");
    if (!formattedValue) return;
    const message = await postMessage({
      content: formattedValue,
      channelId: props.channelId,
    }).catch((err) => {
      alert(err.message);
      setValue(formattedValue);
    });
    if (!message) return;

    props.setMessages([...props.messages, message]);
  };

  return (
    <FlexColumn gap={4}>
      <Input
        type="textarea"
        class={css`
          flex: 1;
        `}
        onText={setValue}
        value={value()}
        minHeight={120}
        placeholder="Message"
      />
      <FlexRow
        gap={4}
        class={css`
          justify-content: space-between;
          margin-top: 4px;
        `}
      >
        <Button
          label="Attach"
          iconName="attach_file"
          margin={0}
          class={css`
            flex-shrink: 0;
            height: 26px;
          `}
          onClick={sendClick}
        />
        <Button
          label="Send"
          iconName="send"
          margin={0}
          class={css`
            flex-shrink: 0;
            height: 26px;
          `}
          onClick={sendClick}
        />
      </FlexRow>
    </FlexColumn>
  );
};

const MessageLogsContainer = styled(FlexColumn)`
  border-top: solid 1px rgba(255, 255, 255, 0.2);
`;

const MessageLogs = (props: { messages: RawMessage[] }) => {
  return (
    <MessageLogsContainer>
      <For each={props.messages}>
        {(message) => <MessageItem message={message} />}
      </For>
    </MessageLogsContainer>
  );
};

const MessageItemContainer = styled(FlexRow)`
  border-bottom: solid 1px rgba(255, 255, 255, 0.2);
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 4px;
  padding-right: 4px;
`;

const MessageItem = (props: { message: RawMessage }) => {
  const [hovered, setHovered] = createSignal(false);

  const creator = () => props.message.createdBy;

  return (
    <MessageItemContainer
      gap={6}
      onmouseenter={() => setHovered(true)}
      onmouseleave={() => setHovered(false)}
    >
      <CustomLink href={RouterEndpoints.PROFILE(creator().id)}>
        <Avatar user={creator()} size={30} animate={hovered()} />
      </CustomLink>
      <FlexColumn gap={4}>
        <FlexRow gap={4} itemsCenter>
          <FlexRow itemsCenter>
            <CustomLink href={RouterEndpoints.PROFILE(creator().id)}>
              <Text>@{creator().username}</Text>
              <Text opacity={0.6}>:{creator().tag}</Text>
            </CustomLink>
          </FlexRow>
          <Text opacity={0.6} size={12}>
            {formatTimestamp(props.message.createdAt)}
          </Text>
        </FlexRow>
        <Text size={14}>
          <Markup message={props.message} text={props.message.content || ""} />
        </Text>
      </FlexColumn>
    </MessageItemContainer>
  );
};