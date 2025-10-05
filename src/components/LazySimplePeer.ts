export let LazySimplePeer: typeof import("@thaunknown/simple-peer") | null =
  null;

export const loadSimplePeer = () =>
  import("@thaunknown/simple-peer").then((m) => {
    console.log("Loaded SimplePeer");
    LazySimplePeer = m.default;
    return m.default;
  });
