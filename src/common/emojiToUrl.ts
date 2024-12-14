import { unicodeToTwemojiUrl } from "@/emoji";
import env from "./env";

export const emojiToUrl = (emoji: string, hovered: boolean, size = 36) => {
  if (emoji.includes(".")) {
    const url = new URL(
      `${env.NERIMITY_CDN}emojis/${emoji}${
        !hovered && emoji?.endsWith(".gif") ? "?type=webp" : ""
      }`
    );
    url.searchParams.set("size", size.toString());
    return url.href;
  }
  return unicodeToTwemojiUrl(emoji);
};
