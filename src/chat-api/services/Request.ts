import { getStorageString, StorageKeys } from "../../common/localStorage";

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
      Authorization: opts.useToken ? opts.token || token : "",
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
  onProgress?: (percent: number) => void
): Promise<T> {
  const token = getStorageString(StorageKeys.USER_TOKEN, "");
  const url = new URL(opts.url);
  url.search = new URLSearchParams(opts.params || {}).toString();

  const xhr = new XMLHttpRequest();
  xhr.open(opts.method, opts.url, true);

  xhr.setRequestHeader("Authorization", token);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      onProgress?.(Math.round(percentComplete));
    }
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
