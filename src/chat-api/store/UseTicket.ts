import { createSignal } from "solid-js";
import useStore from "./useStore";
import { USER_BADGES, hasBit } from "../Bitwise";
import { getModerationTickets } from "../services/ModerationService";
import { TicketStatus } from "../RawData";
import { getTickets } from "../services/TicketService.ts";

const [hasModerationTicketNotification, setHasModerationTicketNotification] =
  createSignal(false);
const [hasTicketNotification, setHasTicketNotification] = createSignal(false);

const updateModerationTicketNotification = async () => {
  const { account } = useStore();
  const hasModeratorPerm = () =>
    hasBit(account.user()?.badges || 0, USER_BADGES.FOUNDER.bit) ||
    hasBit(account.user()?.badges || 0, USER_BADGES.ADMIN.bit);
  if (!hasModeratorPerm()) return;

  const tickets = await getModerationTickets({
    limit: 1,
    status: TicketStatus.WAITING_FOR_MODERATOR_RESPONSE,
  });
  setHasModerationTicketNotification(tickets.length > 0);
};

const updateTicketNotification = async () => {
  const tickets = await getTickets({
    limit: 1,
    seen: false,
  });
  setHasTicketNotification(tickets.length > 0);
};
const fetchUpdated = () => {
  updateModerationTicketNotification();
  updateTicketNotification();
};

window.setInterval(() => {
  fetchUpdated();
}, 10 * 60 * 1000); // 10 minutes

export default function useTicket() {
  return {
    updateModerationTicketNotification,
    hasModerationTicketNotification,
    updateTicketNotification,
    hasTicketNotification,
    fetchUpdated,
  };
}
