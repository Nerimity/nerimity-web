import { RawTicket, TicketCategory, TicketStatus } from "@/chat-api/RawData";
import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { css, styled } from "solid-styled-components";
import { CustomLink } from "../ui/CustomLink";
import Text from "../ui/Text";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "../ui/Avatar";
import { formatTimestamp } from "@/common/date";

function NotificationCircle() {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        background: "var(--alert-color)",
        "border-radius": "50%",
        color: "white",
        width: "20px",
        height: "20px",
        "font-size": "14px",
      }}
    >
      !
    </div>
  );
}

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

const CategoryToName = {
  [TicketCategory.QUESTION]: "Question",
  [TicketCategory.ACCOUNT]: "Account",
  [TicketCategory.ABUSE]: "Abuse",
  [TicketCategory.OTHER]: "Other",
  [TicketCategory.SERVER_VERIFICATION]: "Verify Server",
} as const;

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
      <Show when={props.as === "user" && props.ticket.seen === false}>
        <NotificationCircle />
      </Show>
      <Text opacity={0.4} class={css`width`}>
        #{props.ticket.id}
      </Text>
      <FlexColumn
        class={css`
          align-items: start;
        `}
      >
        <FlexRow gap={4} itemsCenter>
          <StatusText bgColor={ticketStatus()?.color!}>
            {ticketStatus()?.text}
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
                  background-color: rgba(0, 0, 0, 0.3);
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

export const TicketStatusToName = (as: "mod" | "user") =>
  ({
    [TicketStatus.CLOSED_AS_DONE]: {
      text: "Resolved",
      color: "var(--success-color)",
    },
    [TicketStatus.CLOSED_AS_INVALID]: {
      text: "Invalid",
      color: "var(--alert-color)",
    },
    [TicketStatus.WAITING_FOR_MODERATOR_RESPONSE]: {
      text: as === "user" ? "Reply Sent" : "Response Needed",
      color: as === "user" ? "var(--primary-color)" : "var(--warn-color)",
    },
    [TicketStatus.WAITING_FOR_USER_RESPONSE]: {
      text: as === "user" ? "Response Needed" : "Reply Sent",
      color: as === "user" ? "var(--warn-color)" : "var(--primary-color)",
    },
  } as Record<string, { text: string; color: string }>);
