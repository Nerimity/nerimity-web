import { classNames } from '@/common/classNames';
import { useWindowProperties } from '@/common/useWindowProperties';
import { Show } from 'solid-js';
import { styled } from 'solid-styled-components';

interface Props {
  hexColor: string;
  url?: string | null;
  size: number;
  class?: string;
  animate?: boolean
}

const AvatarContainer = styled("div")`
  flex-shrink: 0;
  overflow: hidden;
`;

interface ImageContainerProps {
  color: string;
  size: number;
}

// Weird trick to fix background color bleed.
const ImageContainer = styled("div")<ImageContainerProps>`
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  &:before {
    border-radius: 50%;
    content: "";
    position: absolute;
    ${props => props.color ? `background-color: ${props.color}` : ''};
    inset: 0.6px;
  }
`;

const Image = styled("img")`
  position: relative;
  object-fit: cover;
  height: 100%;
  width: 100%;
  border-radius: 50%;
`;

export default function Avatar(props: Props) {

  const {hasFocus} = useWindowProperties();


  const url = () => {
    if (!props.url?.endsWith(".gif")) return props.url;
    if (!hasFocus()) return props.url + "?type=webp";
    if (props.animate) return props.url;
    return props.url + "?type=webp";
  }

  return (
    <AvatarContainer class={classNames("avatar-container", props.class)}>
      <ImageContainer color={props.url ? undefined :  props.hexColor} size={props.size}>
        <Show when={!props.url}><Image src="/assets/profile.png" alt="User Avatar" /></Show>
        <Show when={props.url}><Image src={url()} alt="User Avatar" /></Show>
      </ImageContainer>
    </AvatarContainer>
  )
}