import env from "@/common/env";
import { request, xhrRequest } from "./Request";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";
import ServiceEndpoints from "./ServiceEndpoints";

const [tokens, setTokens] = useLocalStorage<
  {
    token: string;
    channelId?: string;
    createdAt: number;
  }[]
>(StorageKeys.CDN_TOKEN, []);

const generateToken = async (channelId?: string) => {
  const existingToken = tokens().find((t) => t.channelId === channelId);

  if (existingToken) {
    const expired = Date.now() - existingToken.createdAt > 2 * 60 * 1000;
    if (!expired) {
      return existingToken.token;
    }
  }

  const res = await request<{ token: string }>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      (channelId ? ServiceEndpoints.channel(channelId) : "") +
      "/cdn/token",
    useToken: true
  });

  const newToken = {
    token: res.token,
    channelId,
    createdAt: Date.now()
  };

  setTokens([
    newToken,
    ...tokens()
      .filter((t) => Date.now() - t.createdAt <= 2 * 60 * 1000)
      .slice(0, 9)
  ]);

  return res.token;
};
interface NerimityCDNRequestOpts {
  file: File;
  onUploadProgress?: (progress: number) => void;
  channelId?: string;
}

export async function uploadBanner(
  groupId: string,
  opts: NerimityCDNRequestOpts & { points?: number[] }
) {
  return nerimityCDNUploadRequest({
    ...opts,
    type: "profile_banners",
    groupId
  });
}

export async function uploadAvatar(
  groupId: string,
  opts: NerimityCDNRequestOpts & { points?: number[] }
) {
  return nerimityCDNUploadRequest({ ...opts, type: "avatars", groupId });
}

export async function uploadEmoji(opts: NerimityCDNRequestOpts) {
  return nerimityCDNUploadRequest({ ...opts, type: "emojis" });
}

export async function uploadAttachment(
  groupId: string,
  opts: NerimityCDNRequestOpts
) {
  return nerimityCDNUploadRequest({ ...opts, type: "attachments", groupId });
}

async function nerimityCDNUploadRequest(opts: {
  type: "avatars" | "profile_banners" | "emojis" | "attachments";
  channelId?: string;
  points?: number[];
  file: File;
  groupId?: string;
  onUploadProgress?: (percent: number, speed?: string) => void;
}) {
  const url = new URL(`${env.NERIMITY_CDN}${opts.type}/${opts.groupId || ""}`);

  const formData = new FormData();
  formData.append("f", opts.file);

  return xhrRequest<{ fileId: string }>(
    {
      method: "POST",
      url: url.href,
      body: formData,
      params: opts.points ? { points: JSON.stringify(opts.points) } : undefined,
      useToken: await generateToken(opts.channelId)
    },
    opts.onUploadProgress
  );
}
