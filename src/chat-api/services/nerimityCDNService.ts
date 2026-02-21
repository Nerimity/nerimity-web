import env from "@/common/env";
import { request, xhrRequest } from "./Request";

interface NerimityCDNRequestOpts {
  url: string;
  file: File;
  query?: Record<string, any>;
  onUploadProgress?: (progress: number) => void;
}

export async function uploadBanner(
  groupId: string,
  opts: Omit<NerimityCDNRequestOpts, "url"> & { points?: number[] }
) {
  return nerimityCDNUploadRequest({ ...opts, image: true }).then((res) => {
    return nerimityCDNRequest({
      ...opts,
        query: {
        points: opts.points ? JSON.stringify(opts.points) : undefined,
      },
      url: `${env.NERIMITY_CDN}banners/${groupId}/${res.fileId}`,
    });
  });
}

export async function uploadAvatar(
  groupId: string,
  opts: Omit<NerimityCDNRequestOpts, "url"> & { points?: number[] }
) {
  return nerimityCDNUploadRequest({ ...opts, image: true }).then((res) => {
    return nerimityCDNRequest({
      ...opts,
      query: {
        points: opts.points ? JSON.stringify(opts.points) : undefined,
      },
      url: `${env.NERIMITY_CDN}avatars/${groupId}/${res.fileId}`,
    });
  });
}

export async function uploadEmoji(opts: Omit<NerimityCDNRequestOpts, "url">) {
  return nerimityCDNUploadRequest({ ...opts, image: true }).then((res) => {
    return nerimityCDNRequest({
      ...opts,
      url: `${env.NERIMITY_CDN}emojis/${res.fileId}`,
    });
  });
}

export async function uploadAttachment(
  groupId: string,
  opts: Omit<NerimityCDNRequestOpts, "url">
) {
  return nerimityCDNUploadRequest({ ...opts }).then((res) => {
    return nerimityCDNRequest({
      ...opts,
      url: `${env.NERIMITY_CDN}attachments/${groupId}/${res.fileId}`,
    });
  });
}

function nerimityCDNUploadRequest(opts: {
  image?: boolean;
  file: File;
  onUploadProgress?: (percent: number, speed?: string) => void;
}) {
  const url = new URL(`${env.NERIMITY_CDN}upload`);

  if (opts.image) {
    url.search = new URLSearchParams({ image: "true" }).toString();
  }

  const formData = new FormData();
  formData.append("f", opts.file);

  return xhrRequest<{ fileId: string }>(
    {
      method: "POST",
      url: url.href,
      body: formData,
      useToken: false,
    },
    opts.onUploadProgress
  );
}

function nerimityCDNRequest(opts: NerimityCDNRequestOpts) {
  return request<{ fileId: string }>({
    method: "POST",
    url: opts.url,
    params: JSON.parse(JSON.stringify(opts.query || {})),
    useToken: false,
  });
}
