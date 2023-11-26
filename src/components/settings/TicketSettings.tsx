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
import { A, Route, Router, Routes, useParams } from "@solidjs/router";
import { Dynamic } from "solid-js/web";
import { fetchMessages, postMessage } from "@/chat-api/services/MessageService";
import Avatar from "../ui/Avatar";
import { Markup } from "../Markup";
import RouterEndpoints from "@/common/RouterEndpoints";
import Input from "../ui/input/Input";
import Button from "../ui/Button";

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
      <Route path="/" component={TicketListPage} />
      <Route path="/:id" component={TicketPage} />
    </Routes>
  );
}

const TicketPage = () => {
  const params = useParams<{ id: string }>();

  const [ticket, setTicket] = createSignal<RawTicket | null>(null);
  const [messages, setMessages] = createSignal<RawMessage[]>([]);

  onMount(async () => {
    const ticket = await getTicket(params.id);
    setTicket(ticket);
    if (!ticket) return;

    const messages = await fetchMessages(ticket.channelId, {
      afterMessageId: "0",
    });
    setMessages(messages);
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.tickets")!} href="../" />
        <BreadcrumbItem title={"Ticket"} />
      </Breadcrumb>
      <Show when={ticket()}>
        <TicketItem as="user" ticket={ticket()!} disableClick={true} />
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

const TicketListPage = () => {
  const [tickets, setTickets] = createSignal<RawTicket[]>([]);
  const { isMobileWidth } = useWindowProperties();

  onMount(async () => {
    const tickets = await getTickets();
    setTickets(tickets);
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.tickets")!} />
      </Breadcrumb>

      <Show when={!isMobileWidth()}>
        <table style={{ border: "none" }} cellspacing="0" cellpadding="0">
          <For each={tickets()}>
            {(ticket) => <TicketItemTable as="user" ticket={ticket} />}
          </For>
        </table>
      </Show>

      <Show when={isMobileWidth()}>
        <FlexColumn gap={8}>
          <For each={tickets()}>
            {(ticket) => <TicketItem as="user" ticket={ticket} />}
          </For>
        </FlexColumn>
      </Show>
    </Container>
  );
};

const TableRowStyle = css`
  display: table-row;
  height: 30px;
  user-select: none;
  cursor: pointer;
  .firstCol {
    transition: 0.2s;
    opacity: 0.6;
  }
  &:hover {
    .firstCol {
      opacity: 1;
    }
  }
`;

const StatusText = styled("div")<{ bgColor: string }>`
  background-color: ${(props) => props.bgColor};
  border-radius: 6px;
  padding: 2px;
  padding-left: 6px;
  padding-right: 6px;
  font-size: 16px;
  color: black;
`;

const StatusToName = (as: "mod" | "user") =>
  ({
    [TicketStatus.CLOSED_AS_DONE]: {
      text: "Resolved",
      color: "var(--primary-color)",
    },
    [TicketStatus.CLOSED_AS_INVALID]: {
      text: "Closed",
      color: "gray",
    },
    [TicketStatus.WAITING_FOR_MODERATOR_RESPONSE]: {
      text: as === "user" ? "Reply Sent" : "Action Required",
      color: as === "user" ? "var(--success-color)" : "var(--warn-color)",
    },
    [TicketStatus.WAITING_FOR_USER_RESPONSE]: {
      text: as === "user" ? "Action Required" : "Reply Sent",
      color: as === "user" ? "var(--warn-color)" : "var(--success-color)",
    },
  } as const);

const CategoryToName = {
  [TicketCategory.QUESTION]: "Question",
  [TicketCategory.ACCOUNT]: "Account",
  [TicketCategory.ABUSE]: "Abuse",
  [TicketCategory.OTHER]: "Other",
} as const;

const TicketItemTable = (props: { ticket: RawTicket; as: "mod" | "user" }) => {
  return (
    <CustomLink href={`./${props.ticket.id}`} class={TableRowStyle}>
      <td class="firstCol">
        <FlexColumn>
          <FlexRow gap={4} itemsCenter>
            <Text opacity={0.6}>#{props.ticket.id}</Text>
            <Text size={14}>{props.ticket.title}</Text>
          </FlexRow>
          <Text
            size={12}
            opacity={0.4}
            class={css`
              margin-left: 22px;
            `}
          >
            {CategoryToName[props.ticket.category]}
          </Text>
        </FlexColumn>
      </td>

      <td
        class={css`
          width: 140px;
        `}
      >
        <FlexColumn
          gap={2}
          class={css`
            align-items: end;
            padding-top: 4px;
            padding-bottom: 4px;
          `}
        >
          <StatusText
            bgColor={StatusToName(props.as)[props.ticket.status].color}
          >
            {StatusToName(props.as)[props.ticket.status].text}
          </StatusText>
          <Text color="white" size={12}>
            {formatTimestamp(props.ticket.lastUpdatedAt)}
          </Text>
        </FlexColumn>
      </td>
    </CustomLink>
  );
};

const TicketItemStyle = css`
  display: flex;
  flex-direction: row;
  user-select: none;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  gap: 4px;
  padding: 6px;
`;

export const TicketItem = (props: {
  ticket: RawTicket;
  disableClick?: boolean;
  as: "mod" | "user";
}) => {
  return (
    <Dynamic
      component={!props.disableClick ? CustomLink : "div"}
      href={`./${props.ticket.id}`}
      class={TicketItemStyle}
    >
      <Text opacity={0.4} class={css`width`}>
        #{props.ticket.id}
      </Text>
      <FlexColumn>
        <FlexRow gap={4} itemsCenter>
          <StatusText
            bgColor={StatusToName(props.as)[props.ticket.status].color}
          >
            {StatusToName(props.as)[props.ticket.status].text}
          </StatusText>
        </FlexRow>
        <FlexRow
          class={css`
            margin-top: 2px;
          `}
        >
          <Text size={14}>{props.ticket.title}</Text>
        </FlexRow>
        <Text
          size={12}
          opacity={0.4}
        >
          {CategoryToName[props.ticket.category]}
        </Text>

        <Show when={props.ticket.openedBy}>
          <CustomLink href={RouterEndpoints.PROFILE(props.ticket.openedBy?.id!)}>
            <FlexRow itemsCenter gap={4} class={css`margin-top: 4px; margin-bottom: 4px;`}>
              <Avatar user={props.ticket.openedBy} size={18} />
              <Text size={12}>{props.ticket.openedBy?.username}:{props.ticket.openedBy?.tag}</Text>
            </FlexRow>
          </CustomLink>
        </Show>

        <FlexColumn
          gap={4}
          class={css`
            align-items: flex-start;
            margin-top: 4px;
          `}
        >
          <Text color="white" size={12}>
            {formatTimestamp(props.ticket.lastUpdatedAt)}
          </Text>
        </FlexColumn>
      </FlexColumn>
    </Dynamic>
  );
};
