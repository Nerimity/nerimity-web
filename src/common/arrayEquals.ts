export function arrayEquals<A extends unknown[], B extends unknown[]>(
  a: A,
  b: B
) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
