import {styled} from 'solid-styled-components';
import { FlexRow } from "@/components/ui/Flexbox";
import { ChannelType } from '@/chat-api/RawData';
import { unicodeToTwemojiUrl } from '@/emoji';
import { Show } from 'solid-js';
import Icon from './ui/icon/Icon';
import env from '@/common/env';
import Text from './ui/Text';


const ChannelIconContainer = styled(FlexRow)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  width: 18px;
  `;
const ChannelIconImage = styled("img")`
  border-radius: 4px;
  height: 18px;
  width: 18px;
`;


export const ChannelIcon = (props: { icon?: string; type?: ChannelType; hovered?: boolean }) => {
  const url = () => {
    if (props.icon!.includes(".")) {
      const url = new URL(`${env.NERIMITY_CDN}emojis/${props.icon}${!props.hovered && props.icon?.endsWith(".gif") ? "?type=webp" : ""}`);
      url.searchParams.set("size", "36");
      return url.href;
    }
    return unicodeToTwemojiUrl(props.icon!);
  };
  const iconName = () => {
    if (props.type === ChannelType.CATEGORY) return "segment";
  };

  return (
    <ChannelIconContainer>
      <Show when={!props.icon}>
        <Show when={props.type !== ChannelType.SERVER_TEXT} fallback={<Text color='rgba(255,255,255,0.6)'>#</Text>}>
          <Icon name={iconName()} color='rgba(255,255,255,0.6)' size={18} />
        </Show>
      </Show>
      <Show when={props.icon}>
        <ChannelIconImage src={url()} />
      </Show>
    </ChannelIconContainer>
  );
};