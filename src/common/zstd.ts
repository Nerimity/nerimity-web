import * as fzstd from "fzstd";

const decompressString = (input: Uint8Array) => {
  return fzstd.decompress(input);
};

export const decompressObject = <T>(input: Uint8Array) => {
  const decompressed = decompressString(input);
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decompressed);
  return JSON.parse(jsonString) as T;
};
