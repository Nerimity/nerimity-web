import {
  createEffect,
  lazy,
  Match,
  Switch
} from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { Route, useMatch, useParams } from "solid-navigator";
import TicketsPage from "../tickets/TicketsPage";

const TicketPage = lazy(() => import("@/pages/TicketPage"));


export default function TicketSettings() {
  const { header } = useStore();
  createEffect(() => {
    header.updateHeader({
      title: "Settings - Tickets",
      iconName: "settings"
    });
  });
  const showTicketPage = useMatch(() => "/app/settings/tickets/:id");

  return (
    <Switch fallback={<TicketsPage/>}>
      <Match when={showTicketPage()}><TicketPage/></Match>
    </Switch>
  );
}

