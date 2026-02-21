import { log } from "@/common/logger";

export let LazySimplePeer: typeof import("@thaunknown/simple-peer") | null =
  null;

export const loadSimplePeer = () =>
  import("@thaunknown/simple-peer").then((m) => {
    log("RTC", "Loaded simple-peer");
    LazySimplePeer = m.default;
    return m.default;
  });
