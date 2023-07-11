export async function LazySimplePeer() {
  // needed for simple-peer
  if (!global.process) {
    const process = await import("process");
    global.process = process;
    global.crypto = crypto;
  }
  const SimplePeer = await import("@thaunknown/simple-peer");
  return SimplePeer.default;
}