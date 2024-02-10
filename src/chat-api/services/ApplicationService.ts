import env from "@/common/env";
import { RawApplication } from "../RawData";
import { request } from "./Request";

export const getApplication = async (id: string) => {
  const data = await request<RawApplication>({
    method: "GET",
    url: env.SERVER_URL + "/api/applications/" + id,
    useToken: true
  });
  return data;
};

export const getApplications = async () => {
  const data = await request<RawApplication[]>({
    method: "GET",
    url: env.SERVER_URL + "/api/applications",
    useToken: true
  });
  return data;
};

export const createApplication = async () => {
  const data = await request<RawApplication>({
    method: "POST",
    url: env.SERVER_URL + "/api/applications",
    useToken: true
  });
  return data;
};