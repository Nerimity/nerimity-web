import { getTickets } from "@/chat-api/services/TicketService.ts";
import { useWindowProperties } from "@/common/useWindowProperties";
import { For, Show, createSignal, onMount } from "solid-js";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { RawTicket, TicketCategory, TicketStatus } from "@/chat-api/RawData";
import { css, styled } from "solid-styled-components";
import { formatTimestamp } from "@/common/date";
import Text from "../ui/Text";
import { CustomLink } from "../ui/CustomLink";
import Avatar from "../ui/Avatar";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Dynamic } from "solid-js/web";
import { t } from "i18next";
import { getModerationTickets } from "@/chat-api/services/ModerationService";
import { useMatch } from "@solidjs/router";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const TicketsPage = () => {
  const [tickets, setTickets] = createSignal<RawTicket[]>([]);

  const isModeration = useMatch(() => "/app/moderation/*");

  onMount(async () => {
    const tickets = await (isModeration() ? getModerationTickets : getTickets)({
      limit: 30,
    });
    setTickets(tickets);
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
          <BreadcrumbItem href="/app" icon="home" title="Dashboard" />
          <BreadcrumbItem title={t("settings.drawer.tickets")!} />
        </Breadcrumb>
      </div>
      <FlexColumn gap={8}>
        <For each={tickets()}>
          {(ticket) => (
            <TicketItem as={isModeration() ? "mod" : "user"} ticket={ticket} />
          )}
        </For>
      </FlexColumn>
    </Container>
  );
};

const StatusText = styled("div")<{ bgColor: string }>`
  background-color: ${(props) => props.bgColor};
  border-radius: 6px;
  padding: 2px;
  padding-left: 6px;
  padding-right: 6px;
  font-size: 16px;
  color: black;
`;

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
        <Text size={12} opacity={0.4}>
          {CategoryToName[props.ticket.category]}
        </Text>

        <Show when={props.ticket.openedBy}>
          <CustomLink
            href={RouterEndpoints.PROFILE(props.ticket.openedBy?.id!)}
          >
            <FlexRow
              itemsCenter
              gap={4}
              class={css`
                margin-top: 4px;
                margin-bottom: 4px;
              `}
            >
              <Avatar user={props.ticket.openedBy} size={18} />
              <Text size={12}>
                {props.ticket.openedBy?.username}:{props.ticket.openedBy?.tag}
              </Text>
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

const CategoryToName = {
  [TicketCategory.QUESTION]: "Question",
  [TicketCategory.ACCOUNT]: "Account",
  [TicketCategory.ABUSE]: "Abuse",
  [TicketCategory.OTHER]: "Other",
} as const;

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

export default TicketsPage;
