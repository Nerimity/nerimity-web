import { Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import env from "@/common/env";
import { unicodeToTwemojiUrl } from "@/emoji";
import { useWindowProperties } from "@/common/useWindowProperties";
import { Tooltip } from "./Tooltip";

const ChannelIconImage = styled("img")`
  border-radius: 4px;
  height: 18px;
  width: 18px;
  flex-shrink: 0;
  object-fit: scale-down;
`;

const tooltipStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Emoji = (props: {
  title?: string;
  icon?: string | null;
  size: number;
  resize?: number;
  hovered?: boolean;
}) => {
  const { hasFocus } = useWindowProperties();
  const url = () => {
    if (props.icon!.includes(".")) {
      const shouldBeStatic = () => {
        const isGif = props.icon?.endsWith(".gif");
        const isAnimatedWebp = props.icon?.endsWith(".webp#a");

        if (!isAnimatedWebp && !isGif) {
          return false;
        }

        return !props.hovered || !hasFocus();
      };

      const url = new URL(`${env.NERIMITY_CDN}emojis/${props.icon}`);
      if (props.resize) {
        url.searchParams.set("size", props.resize.toString());
      }
      if (shouldBeStatic()) {
        url.searchParams.set("type", "webp");
      }
      return url.href;
    }
    return unicodeToTwemojiUrl(props.icon!);
  };

  return (
    <Show when={props.icon}>
      <Tooltip tooltip={props.title} anchor="right" class={tooltipStyles}>
        <ChannelIconImage
          src={url()}
          style={{ height: `${props.size}px`, width: `${props.size}px` }}
        />
      </Tooltip>
    </Show>
  );
};
