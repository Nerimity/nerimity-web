import env from "../../common/env";
import { RawReminder } from "../RawData";
import { request } from "./Request";

interface AddReminderOpts {
  postId?: string;
  messageId?: string;
  timestamp: number;
}

export const addReminder = async (opts: AddReminderOpts) => {
  const data = await request<RawReminder>({
    method: "POST",
    url: env.SERVER_URL + "/api/reminders",
    body: opts,
    useToken: true,
  });
  return data;
};

export const deleteReminder = async (reminderId: string) => {
  return await request<any>({
    method: "DELETE",
    url: env.SERVER_URL + "/api/reminders/" + reminderId,
    useToken: true,
  });
};
