import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";
import { RawChannel, RawChannelNotice, RawTicket, TicketCategory, TicketStatus } from "../RawData";
import env from "@/common/env";

interface GetTicketsOpts {
  limit: number;
  status?: TicketStatus;
  seen?: boolean
}

export const getTickets = async (opts: GetTicketsOpts) => {
  const data = await request<RawTicket[]>({
    method: 'GET',
    params: {
      ...(opts.status !== undefined ? {status: opts.status} : undefined),
      ...(opts.seen !== undefined ? {seen: opts.seen} : undefined),
      limit: opts.limit
    },
    url: env.SERVER_URL + "/api" + ServiceEndpoints.tickets(),
    useToken: true,
  });
  return data;
};

export const getTicket = async (id: string) => {
  const data = await request<RawTicket>({
    method: 'GET',
    url: env.SERVER_URL + "/api" + ServiceEndpoints.tickets(id),
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

export const updateTicket = async (ticketId: string, status: TicketStatus) => {
  const data = await request<RawTicket>({
    method: 'POST',
    url: env.SERVER_URL + "/api" + ServiceEndpoints.tickets(ticketId),
    body: {status},
    useToken: true,
  });
  return data;
}