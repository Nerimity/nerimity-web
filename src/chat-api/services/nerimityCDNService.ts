import env from "@/common/env";
import { request, xhrRequest } from "./Request";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";

const [token, setToken] = useLocalStorage<{
  token: string;
  createdAt: number;
} | null>(StorageKeys.CDN_TOKEN, null);

const generateToken = async () => {
  if (token()) {
    const expired = Date.now() - token()!.createdAt > 2 * 60 * 1000;
    if (!expired) {
      return token()!.token;
    }
  }

  const res = await request<{ token: string }>({
    method: "POST",
    url: env.SERVER_URL + "/api/cdn/token",
    useToken: true
  });

  setToken({
    token: res.token,
    createdAt: Date.now()
  });
  return res.token;
};
interface NerimityCDNRequestOpts {
  file: File;
  onUploadProgress?: (progress: number) => void;
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
      useToken: await generateToken()
    },
    opts.onUploadProgress
  );
}
