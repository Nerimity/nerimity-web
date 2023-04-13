import { getStorageString, StorageKeys } from "../../common/localStorage";

interface RequestOpts {
  url: string;
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  useToken?: boolean;
  notJSON?: boolean;
  params?: Record<any, any>;
}

export async function request<T>(opts: RequestOpts): Promise<T> {
  const token = getStorageString(StorageKeys.USER_TOKEN, '' );
  const url = new URL(opts.url);
  url.search = new URLSearchParams(opts.params || {}).toString();

  const response = await fetch(url, {
    method: opts.method,
    body: opts.body instanceof FormData ? opts.body :  JSON.stringify(opts.body),
    headers: {
      ...(!(opts.body instanceof FormData) ? {'Content-Type': 'application/json'} : undefined),
      'Authorization': opts.useToken ? token : ''
    }
  })
  .catch(err => { throw { message: "Could not connect to server. " + err.message } });

  const text = await response.text()
  if (opts.notJSON) return text as T;

  try {
    const json = JSON.parse(text);
    if (!response.ok) {
      return Promise.reject(json)
    }
    return json;
  } catch (e) {
    throw {message: text}
  }
}
