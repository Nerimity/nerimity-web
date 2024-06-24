import pako from "pako";
import * as Base64 from "base64-arraybuffer";

export function zip(value: string) {
  const binaryString = pako.deflate(value);
  return Base64.encode(binaryString);
}

export function unzip(base64: string) {
  try {
    return pako.inflate(Base64.decode(base64), { to: "string" });
  }
  catch {
    return null;
  }
}


export function unzipJson(base64: string){
  try {
    return JSON.parse(unzip(base64) || "");
  }
  catch {
    return null;
  }
}