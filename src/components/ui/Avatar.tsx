import { classNames } from '@/common/classNames';
import { Show } from 'solid-js';
import { styled } from 'solid-styled-components';

interface Props {
  hexColor: string;
  url?: string;
  size: number;
  class?: string;
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
    background-color: ${props => props.color};
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
  return (
    <AvatarContainer class={classNames("avatar-container", props.class)}>
      <ImageContainer color={props.hexColor} size={props.size}>
        <Show when={!props.url}><Image src="/assets/profile.png" alt="User Avatar" /></Show>
      </ImageContainer>
    </AvatarContainer>
  )
}