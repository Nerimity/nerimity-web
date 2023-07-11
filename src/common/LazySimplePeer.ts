export async function LazySimplePeer() {
  const SimplePeer = await import("@thaunknown/simple-peer");
  return SimplePeer.default;
}