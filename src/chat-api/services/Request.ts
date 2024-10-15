import { getStorageString, StorageKeys } from "../../common/localStorage";

// most, if not all of these messages come from cloudflare
const ErrorCodeToMessage: Record<number, string> = {
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
};

interface RequestOpts {
  url: string;
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  useToken?: boolean;
  notJSON?: boolean;
  params?: Record<any, any>;
  token?: string | null;
}

export async function request<T>(opts: RequestOpts): Promise<T> {
  const token = getStorageString(StorageKeys.USER_TOKEN, "");
  const url = new URL(opts.url);
  url.search = new URLSearchParams(opts.params || {}).toString();

  const response = await fetch(url, {
    method: opts.method,
    body: opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body),
    headers: {
      ...(!(opts.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : undefined),
      ...(opts.useToken || opts.token
        ? { Authorization: opts.token || token }
        : {}),
    },
  }).catch((err) => {
    throw { message: "Could not connect to server. " + err.message };
  });

  const text = await response.text();

  try {
    if (!response.ok) {
      const code = response.status;
      const message = ErrorCodeToMessage[code];
      if (message) {
        throw { message, code };
      }
      const json = JSON.parse(text);
      return Promise.reject(json);
    }
    if (opts.notJSON) return text as T;
    return JSON.parse(text);
  } catch (e) {
    throw { message: text };
  }
}

interface XHROpts {
  url: string;
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  body: FormData;
  useToken?: boolean;
  notJSON?: boolean;
  params?: Record<any, any>;
}

export function xhrRequest<T>(
  opts: XHROpts,
  onProgress?: (percent: number, speed?: string) => void
): Promise<T> {
  const token = getStorageString(StorageKeys.USER_TOKEN, "");
  const url = new URL(opts.url);
  url.search = new URLSearchParams(opts.params || {}).toString();

  const xhr = new XMLHttpRequest();
  xhr.open(opts.method, opts.url, true);

  if (opts.useToken) {
    xhr.setRequestHeader("Authorization", token);
  }

  const progressHandler = createProgressHandler(onProgress);

  xhr.upload.onprogress = (e) => {
    progressHandler(e);
  };

  return new Promise((res, rej) => {
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        const text = xhr.responseText;
        try {
          if (xhr.status === 0) {
            return rej({ message: "Could not connect to server." });
          }
          const message = ErrorCodeToMessage[xhr.status];
          if (message) {
            throw { message, code: xhr.status };
          }
          if (xhr.status !== 200) {
            const json = JSON.parse(text);
            return rej(json);
          }
          if (opts.notJSON) return res(text as T);
          const json = JSON.parse(text);
          return res(json);
        } catch (e) {
          throw { message: text };
        }
      }
    };

    xhr.send(opts.body);
  });
}

export const createProgressHandler = (
  onProgress?: (percent: number, speed?: string) => void
) => {
  let startTime = 0;
  let uploadedSize = 0;
  return (e: ProgressEvent) => {
    if (!startTime) {
      startTime = Date.now();
    }
    uploadedSize = e.loaded;

    const elapsedTime = Date.now() - startTime;
    const uploadSpeed = uploadedSize / (elapsedTime / 1000); // Bytes per second
    const uploadSpeedKBps = uploadSpeed / 1024; // Kilobytes per second
    const uploadSpeedMBps = uploadSpeedKBps / 1024; // Megabytes per second

    // Choose the appropriate unit based on the speed
    let unit = " KB/s";
    if (uploadSpeedMBps >= 1) {
      unit = " MB/s";
    }
    let speed: string | undefined =
      uploadSpeedMBps >= 1
        ? uploadSpeedMBps.toFixed(2) + unit
        : uploadSpeedKBps.toFixed(0) + unit;

    if (uploadSpeedMBps == Infinity) {
      speed = "0 KB/s";
    }

    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      onProgress?.(Math.round(percentComplete), speed);
    }
  };
};
