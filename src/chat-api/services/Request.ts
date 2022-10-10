import { getStorageString, StorageKeys } from "../../common/localStorage";

interface RequestOpts {
  url: string;
  method: string;
  body?: any;
  useToken?: boolean;
  notJSON?: boolean;
}

export async function request<T>(opts: RequestOpts): Promise<T> {
  const token = getStorageString(StorageKeys.USER_TOKEN, '' );
  const response = await fetch(opts.url, {
    method: opts.method,
    body: JSON.stringify(opts.body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': opts.useToken ? token : ''
    }
  })
  .catch(err => { throw {message: "Could not connect to server. " + err.message} });
  if (opts.notJSON) return await response.text() as T;
  if (!response.ok) {
    throw await response.json();
  }
  return await response.json();
}
