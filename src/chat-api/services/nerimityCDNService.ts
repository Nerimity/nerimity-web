import env from "@/common/env";
import { xhrRequest } from "./Request";


interface NerimityCDNRequestOpts {
  url: string;
  file: File;
  onUploadProgress?: (progress: number) => void;
}


export function uploadAttachment(groupId: string, opts: Omit<NerimityCDNRequestOpts, "url">) {
  return nerimityCDNRequest({
    ...opts,
    url: `${env.NERIMITY_CDN}attachments/${groupId}`,
  })
}

function nerimityCDNRequest(opts: NerimityCDNRequestOpts) {
  const formData = new FormData();
  formData.append("attachment", opts.file);

  return xhrRequest<{ fileId: string }>(
    {
      method: "POST",
      url: opts.url,
      body: formData,
      useToken: false
    },
    opts.onUploadProgress
  );
}