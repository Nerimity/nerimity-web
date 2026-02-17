import style from "./ChannelIcon.module.css";
import { ChannelType } from "@/chat-api/RawData";
import { unicodeToTwemojiUrl } from "@/emoji";
import { Show } from "solid-js";
import Icon from "./ui/icon/Icon";
import env from "@/common/env";
import Text from "./ui/Text";
import { cn } from "@/common/classNames";

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
    <div class={cn(style.channelIconContainer, props.class)}>
      <Show when={!props.icon}>
        <Show
          when={props.type !== ChannelType.SERVER_TEXT}
          fallback={<Text color="rgba(255,255,255,0.6)">#</Text>}
        >
          <Icon name={iconName()} color="rgba(255,255,255,0.6)" size={18} />
        </Show>
      </Show>
      <Show when={props.icon}>
        <img class={style.channelIconImage} src={url()} />
      </Show>
    </div>
  );
};
