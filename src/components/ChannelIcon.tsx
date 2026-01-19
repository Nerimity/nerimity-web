import { styled } from "solid-styled-components";
import { FlexRow } from "@/components/ui/Flexbox";
import { ChannelType } from "@/chat-api/RawData";
import { unicodeToTwemojiUrl } from "@/emoji";
import { Show } from "solid-js";
import Icon from "./ui/icon/Icon";
import env from "@/common/env";
import Text from "./ui/Text";

const ChannelIconContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  width: 18px;
  user-select: none;

  background-color: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 4px;
`;
const ChannelIconImage = styled("img")`
  border-radius: 4px;
  height: 18px;
  width: 18px;
  object-fit: scale-down;
`;

export const ChannelIcon = (props: {
  icon?: string;
  type?: ChannelType;
  hovered?: boolean;
  class?: string;
}) => {
  const url = () => {
    const shouldBeStatic = () => {
      const isGif = props.icon?.endsWith(".gif");
      const isAnimatedWebp = props.icon?.endsWith(".webp#a");

      if (!isAnimatedWebp && !isGif) {
        return false;
      }

      return !props.hovered;
    };

    if (props.icon!.includes(".")) {
      const url = new URL(`${env.NERIMITY_CDN}emojis/${props.icon}`);
      url.searchParams.set("size", "36");

      if (shouldBeStatic()) {
        url.searchParams.set("type", "webp");
      }
      return url.href;
    }
    return unicodeToTwemojiUrl(props.icon!);
  };
  const iconName = () => {
    if (props.type === ChannelType.CATEGORY) return "segment";
  };

  return (
    <ChannelIconContainer class={props.class}>
      <Show when={!props.icon}>
        <Show
          when={props.type !== ChannelType.SERVER_TEXT}
          fallback={<Text color="rgba(255,255,255,0.6)">#</Text>}
        >
          <Icon name={iconName()} color="rgba(255,255,255,0.6)" size={18} />
        </Show>
      </Show>
      <Show when={props.icon}>
        <ChannelIconImage src={url()} />
      </Show>
    </ChannelIconContainer>
  );
};
