import { getOwner, Owner, runWithOwner } from "solid-js";

let ctx: Owner | null = null;

export const setContext = () => {
  ctx = getOwner();
}

export function runWithContext<T>(callback: () => T): T {
  return runWithOwner(ctx!, callback)
}