import { USER_BADGES, addBit, hasBit, removeBit } from "@/chat-api/Bitwise";
import {
  ModerationUser,
  getTickets,
  getUser,
  getUsersWithSameIPAddress,
  updateUser,
} from "@/chat-api/services/ModerationService";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { A, useParams } from "@solidjs/router";
import { For, Show, createEffect, createSignal, on, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { Banner } from "../ui/Banner";
import Avatar from "../ui/Avatar";
import RouterEndpoints from "@/common/RouterEndpoints";
import { bannerUrl } from "@/chat-api/store/useUsers";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Input from "../ui/input/Input";
import Checkbox from "../ui/Checkbox";
import { formatTimestamp } from "@/common/date";
import UnsuspendUsersModal from "./UnsuspendUsersModal";
import SuspendUsersModal from "./SuspendUsersModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Button from "../ui/Button";
import env from "@/common/env";
import Text from "../ui/Text";
import { RawServer, RawTicket, RawUser } from "@/chat-api/RawData";
import { Server, User } from "./ModerationPane";
import { TicketItem } from "../settings/TicketSettings";

const PageContainer = styled(FlexColumn)`
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
  margin-top: 10px;
`;

const TicketListContainer = styled(FlexColumn)`
  padding: 10px;
  gap: 8px;
`;

export default function TicketPage() {
  const [tickets, setTickets] = createSignal<RawTicket[]>([]);

  onMount(async () => {
    const tickets = await getTickets({ limit: 30 });
    setTickets(tickets);
  });

  return (
    <PageContainer>
      <TicketListContainer>
        <For each={tickets()}>
          {(ticket) => <TicketItem as="mod" ticket={ticket} />}
        </For>
      </TicketListContainer>
    </PageContainer>
  );
}
