import { createEffect, createSignal, For, onMount, Show } from "solid-js";
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
import { RawTicket, TicketStatus } from "@/chat-api/RawData";
import { getTicket, getTickets } from "@/chat-api/services/TicketService.ts";
import { formatTimestamp } from "@/common/date";
import { useWindowProperties } from "@/common/useWindowProperties";
import { A, Route, Router, Routes, useParams } from "@solidjs/router";
import { Dynamic } from "solid-js/web";

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
      <Route path="/" component={TicketListPage}/>
      <Route path="/:id" component={TicketPage}/>
    </Routes>

  );
}

const TicketPage = () => {
  const params = useParams<{id: string}>()

  const [ticket, setTicket] = createSignal<RawTicket | null>(null);

  onMount(async () => {
    const ticket = await getTicket(params.id);
    setTicket(ticket);
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.tickets")!} href="../" />
        <BreadcrumbItem title={"Ticket"} />
      </Breadcrumb>
      <Show when={ticket()}>
        <TicketItem ticket={ticket()!} disableClick={true} />
      </Show>
    </Container>
  )
}



const TicketListPage = () => {

  const [tickets, setTickets] = createSignal<RawTicket[]>([]);
  const {isMobileWidth} = useWindowProperties();

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
      <table style={{border: 'none'}} cellspacing="0" cellpadding="0">
        <For each={tickets()}>{(ticket) => <TicketItemTable ticket={ticket} />}</For>
      </table>
    </Show>

    <Show when={isMobileWidth()}>
      <FlexColumn gap={8}>
        <For each={tickets()}>{(ticket) => <TicketItem ticket={ticket} />}</For>
      </FlexColumn>
    </Show>
  </Container>
  )
}





const TableRowStyle = css`
  display: table-row;
  height: 30px;
  user-select: none;
  cursor: pointer;
  opacity: 0.6;
  transition: 0.2s;
  &:hover {
    opacity: 1;
  }
`

const StatusText = styled("div")<{ bgColor: string }>`
  background-color: ${(props) => props.bgColor};
  border-radius: 12px;
  padding: 4px;
  padding-left: 8px;
  padding-right: 8px;
  font-size: 14px;
`;

const StatusToName = {
  [TicketStatus.CLOSED_AS_DONE]: {
    text: "Resolved",
    color: "var(--primary-color)",
  },
  [TicketStatus.CLOSED_AS_INVALID]: {
    text: "Closed",
    color: "gray",
  },
  [TicketStatus.WAITING_FOR_MODERATOR_RESPONSE]: {
    text: "Awaiting moderator response",
    color: "var(--warn-color)",
  },
  [TicketStatus.WAITING_FOR_USER_RESPONSE]: {
    text: "Waiting for your reply",
    color: "var(--success-color)",
  },
} as const;

const TicketItemTable = (props: { ticket: RawTicket }) => {

  return (
    <CustomLink href={`./${props.ticket.id}`} class={TableRowStyle}>
      <td style={{"text-align": 'center'}}>
      <div style={{display: 'flex', "justify-content": 'start', "align-items": 'center', gap: '4px'}}>
      <Text opacity={0.6}>#{props.ticket.id}</Text>
        <StatusText bgColor={StatusToName[props.ticket.status].color}>
            {StatusToName[props.ticket.status].text}
          </StatusText>
      </div>
      </td>
      <td>
        <Text size={14}>{props.ticket.title}</Text>
      </td>

      <td>
        <Text size={14} color="rgba(255,255,255,0.6)">
          Last updated{" "}
          <Text color="white" size={14}>
            {formatTimestamp(props.ticket.lastUpdatedAt)}
          </Text>
        </Text>
      </td>
    </CustomLink>
  );
};


const TicketItemStyle = css`
  display: flex;
  flex-direction: column;
  user-select: none;
`

const TicketItem = (props: { ticket: RawTicket, disableClick?: boolean }) => {

  return (
    <Dynamic component={!props.disableClick ? CustomLink : "div"}  href={`./${props.ticket.id}`}  class={TicketItemStyle}>
      <td style={{"text-align": 'center'}}>
      <div style={{display: 'flex', "justify-content": 'start', "align-items": "center", gap: "4px"}}>
        <Text opacity={0.6}>#{props.ticket.id}</Text>
        <StatusText bgColor={StatusToName[props.ticket.status].color}>
            {StatusToName[props.ticket.status].text}
        </StatusText>
      </div>
      </td>
      <td>
        <Text size={14}>{props.ticket.title}</Text>
      </td>

      <td>
        <Text size={14} color="rgba(255,255,255,0.6)">
          Last updated{" "}
          <Text color="white" size={14}>
            {formatTimestamp(props.ticket.lastUpdatedAt)}
          </Text>
        </Text>
      </td>
    </Dynamic>
  );
};
