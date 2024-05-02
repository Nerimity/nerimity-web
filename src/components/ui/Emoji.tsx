import { Show } from "solid-js";
import { styled } from "solid-styled-components";
import env from "@/common/env";
import { unicodeToTwemojiUrl } from "@/emoji";
import { useWindowProperties } from "@/common/useWindowProperties";

const ChannelIconImage = styled("img")`
  border-radius: 4px;
  height: 18px;
  width: 18px;
  flex-shrink: 0;
`;


export const Emoji = (props: { title?: string; icon?: string | null; size: number; resize?: number; hovered?: boolean }) => {
  const {hasFocus} = useWindowProperties();
  const url = () => {
    if (props.icon!.includes(".")) {
      const url = new URL(`${env.NERIMITY_CDN}emojis/${props.icon}${((!props.hovered || !hasFocus()) && props.icon?.endsWith(".gif")) ? "?type=webp" : ""}`);
      if (props.resize) {
        url.searchParams.set("size", props.resize.toString());
      }
      return url.href;
    }
    return unicodeToTwemojiUrl(props.icon!);
  };

  return (
    <Show when={props.icon}>
      <ChannelIconImage title={props.title} src={url()} style={{"height": `${props.size}px`, "width": `${props.size}px`}}  />
    </Show>
  );
};