import { getTickets } from "@/chat-api/services/TicketService.ts";
import { For, Setter, Show, createEffect, createSignal, on } from "solid-js";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { RawTicket, TicketStatus } from "@/chat-api/RawData";
import { css, styled } from "solid-styled-components";
import Text from "../ui/Text";
import { t } from "i18next";
import { getModerationTickets } from "@/chat-api/services/ModerationService";
import { useMatch } from "solid-navigator";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Button from "../ui/Button";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Checkbox from "../ui/Checkbox";
import { CreateTicketModal } from "../CreateTicketModal";
import { TicketItem, TicketStatusToName } from "./TicketItem";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const TicketsPage = () => {
  const [tickets, setTickets] = createSignal<RawTicket[]>([]);
  const { createPortal } = useCustomPortal();

  const isModeration = useMatch(() => "/app/moderation/*");

  const [ticketSortStatus, setTicketSortStatus] = createSignal<
    undefined | number
  >(isModeration() ? TicketStatus.WAITING_FOR_MODERATOR_RESPONSE : undefined);

  createEffect(
    on(ticketSortStatus, async () => {
      const tickets = await (isModeration()
        ? getModerationTickets
        : getTickets)({
        limit: 30,
        status: ticketSortStatus(),
      });
      setTickets(tickets);
    })
  );

  const createTicketClick = () => {
    createPortal((close) => <CreateTicketModal close={close} />);
  };

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
          <Show when={!isModeration()}>
            <BreadcrumbItem
              href="/app"
              icon="home"
              title={t("dashboard.title")}
            />
          </Show>
          <Show when={isModeration()}>
            <BreadcrumbItem
              href="/app/moderation"
              icon="home"
              title={t("tickets.moderation")}
            />
          </Show>
          <BreadcrumbItem title={t("settings.drawer.tickets")!} />
        </Breadcrumb>
      </div>

      <Show when={isModeration()}>
        <TicketStatusButtons
          selectedStatus={ticketSortStatus()}
          setSelectedStatus={setTicketSortStatus}
        />
      </Show>
      <Show when={!isModeration()}>
        <SettingsBlock icon="sell" label={t("settings.drawer.tickets")}>
          <Button
            iconName="add"
            label={t("tickets.createTicket")}
            onClick={createTicketClick}
          />
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
      <Text>Filter:</Text>
      <FlexRow wrap gap={4}>
        <For each={Object.keys(TicketStatusToName("mod"))}>
          {(key) => {
            const status = TicketStatusToName("mod")[key];
            return (
              <StatusButtonContainer
                itemsCenter
                onClick={() =>
                  props.setSelectedStatus(
                    props.selectedStatus === Number(key)
                      ? undefined
                      : Number(key)
                  )
                }
                style={{ background: status?.color }}
              >
                <Checkbox checked={key === props.selectedStatus?.toString()} />
                {status?.text}
              </StatusButtonContainer>
            );
          }}
        </For>
      </FlexRow>
    </FlexColumn>
  );
};

export default TicketsPage;
