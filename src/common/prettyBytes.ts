export const prettyBytes = (num: number, precision = 3, addSpace = true) => {
  const UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  if (Math.abs(num) < 1) return num + (addSpace ? " " : "");
  const exponent = Math.min(Math.floor(Math.log10(num) / Math.log10(1024)), UNITS.length - 1);
  const n = Number(((num < 0 ? -1 : 1) * num) / Math.pow(1024, exponent));
  return (num < 0 ? "-" : "") + n.toFixed(precision) + " " + UNITS[exponent];
};