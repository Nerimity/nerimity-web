import { getOwner, Owner, runWithOwner } from "solid-js";

let ctx: Owner | null = null;

export const setContext = () => {
  ctx = getOwner();
}

export const runWithContext = (callback: () => void) => {
  runWithOwner(ctx!, callback)
}