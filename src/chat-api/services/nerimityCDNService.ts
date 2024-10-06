import env from "@/common/env";
import { xhrRequest } from "./Request";


interface NerimityCDNRequestOpts {
  url: string;
  file: File;
  query?: Record<string, any>;
  onUploadProgress?: (progress: number) => void;
}



export function uploadBanner(groupId: string, opts: Omit<NerimityCDNRequestOpts, "url">) {
  return nerimityCDNRequest({
    ...opts,
    url: `${env.NERIMITY_CDN}banners/${groupId}`,
  })
}
export function uploadAvatar(groupId: string, opts: Omit<NerimityCDNRequestOpts, "url"> & { points?: number[] }) {
  return nerimityCDNRequest({
    ...opts,
    query: {
      points: opts.points ? JSON.stringify(opts.points) : undefined,
    },
    url: `${env.NERIMITY_CDN}avatars/${groupId}`,
  })
}


export function uploadEmoji(opts: Omit<NerimityCDNRequestOpts, "url">) {
  return nerimityCDNRequest({
    ...opts,
    url: `${env.NERIMITY_CDN}emojis`,
  })
}

export function uploadAttachment(groupId: string, opts: Omit<NerimityCDNRequestOpts, "url">) {
  return nerimityCDNRequest({
    ...opts,
    url: `${env.NERIMITY_CDN}attachments/${groupId}`,
  })
}

function nerimityCDNRequest(opts: NerimityCDNRequestOpts) {
  const url = new URL(opts.url);

  if (opts.query) {
    url.search = new URLSearchParams(JSON.parse(JSON.stringify(opts.query))).toString();
  }

  const formData = new FormData();
  formData.append("attachment", opts.file);

  return xhrRequest<{ fileId: string }>(
    {
      method: "POST",
      url: url.href,
      body: formData,
      useToken: false
    },
    opts.onUploadProgress
  );
}