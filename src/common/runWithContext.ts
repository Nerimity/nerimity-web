import { getOwner, Owner, runWithOwner } from "solid-js";

let ctx: Owner | null = null;

export const setContext = () => {
  ctx = getOwner();
};

export function runWithContext<T>(callback: () => T) {
  return runWithOwner<T>(ctx!, callback);
}