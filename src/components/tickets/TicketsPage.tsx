import { getTickets } from "@/chat-api/services/TicketService.ts";
import { useWindowProperties } from "@/common/useWindowProperties";
import { For, Setter, Show, createEffect, createSignal, on, onMount } from "solid-js";
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
import { useMatch } from "solid-navigator";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Button from "../ui/Button";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { CreateTicketModal } from "../profile-pane/ProfilePane";
import Checkbox from "../ui/Checkbox";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

function NotificationCircle () {
  return (
    <div style={{
      "display": 'flex',
      "align-items": 'center',
      "justify-content": 'center',
      background: 'var(--alert-color)',
      "border-radius": '50%',
      color: "white",
      width: '20px',
      height: '20px',
      "font-size": '14px',
    }}>!</div>
  )
}

const TicketsPage = () => {
  const [tickets, setTickets] = createSignal<RawTicket[]>([]);
  const {createPortal} = useCustomPortal();

  const isModeration = useMatch(() => "/app/moderation/*");

  const [ticketSortStatus, setTicketSortStatus] = createSignal<undefined | number>(undefined);

  createEffect(on(ticketSortStatus, async () => {
    const tickets = await (isModeration() ? getModerationTickets : getTickets)({
      limit: 30,
      status: ticketSortStatus()
    });
    setTickets(tickets);
  }));

  const createTicketClick = () => {
    createPortal(close => <CreateTicketModal close={close} />)
  }

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

      <Show when={isModeration()}>
        <TicketStatusButtons selectedStatus={ticketSortStatus()} setSelectedStatus={setTicketSortStatus}/>
      </Show>
      <Show when={!isModeration()}>
        <SettingsBlock icon="sell" label="Tickets">
          <Button iconName="add" label="Create Ticket" onClick={createTicketClick} />
        </SettingsBlock>
      </Show>
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


const StatusButtonContainer = styled(FlexRow)`
  border-radius: 4px;
  padding: 4px;
  gap: 6px;
  color: black;
  cursor: pointer;
  user-select: none;
`;

const TicketStatusButtons = (props: {
  selectedStatus: number | undefined;
  setSelectedStatus: Setter<number | undefined>;
}) => {
  return (
    <FlexColumn gap={4}>
      <Text>Sort:</Text>
      <FlexRow wrap gap={4}>
        <For each={Object.keys(TicketStatusToName("mod"))}>
          {(key) => {
            const status = TicketStatusToName("mod")[key];
            return (
              <StatusButtonContainer
                itemsCenter
                onClick={() =>
                  props.setSelectedStatus(
                    props.selectedStatus === Number(key) ? undefined : Number(key)
                  )
                }
                style={{ background: status.color }}
              >
                <Checkbox checked={key === props.selectedStatus?.toString()} />
                {status.text}
              </StatusButtonContainer>
            );
          }}
        </For>
      </FlexRow>
    </FlexColumn>
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
  background-color: rgba(46, 49, 52, 1);
  border-radius: 6px;
  gap: 4px;
  padding: 6px;
`;

export const TicketItem = (props: {
  ticket: RawTicket;
  disableClick?: boolean;
  as: "mod" | "user";
}) => {
  const ticketStatus = () => TicketStatusToName(props.as)[props.ticket.status];

  return (
    <Dynamic
      component={!props.disableClick ? CustomLink : "div"}
      href={`./${props.ticket.id}`}
      class={TicketItemStyle}
    >
      <Show when={props.as === "user" && props.ticket.seen === false}><NotificationCircle/></Show>
      <Text opacity={0.4} class={css`width`}>
        #{props.ticket.id}
      </Text>
      <FlexColumn class={css`align-items: start;`}>
        <FlexRow gap={4} itemsCenter>
          <StatusText bgColor={ticketStatus().color}>
            {ticketStatus().text}
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
                padding: 4px;
                border-radius: 4px;
                transition: 0.2s;
                margin-left: -4px;
                &:hover {
                  background-color: rgba(0,0,0,0.3);
                }
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

export const TicketStatusToName = (as: "mod" | "user") =>
  ({
    [TicketStatus.CLOSED_AS_DONE]: {
      text: "Resolved",
      color: "var(--primary-color)",
    },
    [TicketStatus.CLOSED_AS_INVALID]: {
      text: "Invalid",
      color: "var(--alert-color)",
    },
    [TicketStatus.WAITING_FOR_MODERATOR_RESPONSE]: {
      text: as === "user" ? "Reply Sent" : "Response Needed",
      color: as === "user" ? "var(--success-color)" : "var(--warn-color)",
    },
    [TicketStatus.WAITING_FOR_USER_RESPONSE]: {
      text: as === "user" ? "Response Needed" : "Reply Sent",
      color: as === "user" ? "var(--warn-color)" : "var(--success-color)",
    },
  } as Record<string, { text: string; color: string }>);

export default TicketsPage;
