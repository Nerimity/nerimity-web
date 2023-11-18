import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";
import { RawChannel, RawChannelNotice, RawTicket, TicketCategory } from "../RawData";
import env from "@/common/env";

export const getTickets = async () => {
  const data = await request<RawTicket[]>({
    method: 'GET',
    url: env.SERVER_URL + "/api" + ServiceEndpoints.tickets(),
    useToken: true,
  });
  return data;
};

interface CreateTicketOpts {
  category: TicketCategory;
  title: string;
  body: string;
}

export const createTicket = async (opts: CreateTicketOpts) => {
  const data = await request<RawTicket>({
    method: 'POST',
    url: env.SERVER_URL + "/api" + ServiceEndpoints.tickets(),
    body: opts,
    useToken: true,
  });
  return data;
}