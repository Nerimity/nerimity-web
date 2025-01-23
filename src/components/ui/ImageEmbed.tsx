import { useWindowProperties } from "@/common/useWindowProperties";
import { FlexRow } from "./Flexbox";
import { styled } from "solid-styled-components";
import { classNames, conditionalClass } from "@/common/classNames";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { RawAttachment } from "@/chat-api/RawData";
import { createSignal, onCleanup, onMount } from "solid-js";
import env from "@/common/env";
import { ImagePreviewModal } from "./ImagePreviewModal";

const ImageEmbedContainer = styled(FlexRow)`
  user-select: none;
  overflow: hidden;
  position: relative;
  align-self: flex-start;
  cursor: pointer;

  img {
    border-radius: 8px;
  }

  &.gif:after {
    content: "GIF";
    position: absolute;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.46);
    backdrop-filter: blur(34px);
    padding: 5px;
    top: 10px;
    left: 10px;
  }
`;

interface ImageEmbedProps {
  attachment: RawAttachment & { origSrc?: string };
  widthOffset?: number;
  customWidth?: number;
  customHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  ignoreClick?: boolean;
}

export function ImageEmbed(props: ImageEmbedProps) {
  const { paneWidth, height, hasFocus } = useWindowProperties();
  const { createPortal } = useCustomPortal();

  const isGif = () => props.attachment.path?.endsWith(".gif");
  const url = (ignoreFocus?: boolean) => {
    const url = new URL(`${env.NERIMITY_CDN}${props.attachment.path}`);
    if (ignoreFocus) return url.href;
    if (!isGif()) return url.href;
    if (!hasFocus()) {
      url.searchParams.set("type", "webp");
    }
    return url.href;
  };

  const contextMenuSrc = () => {
    return props.attachment.origSrc || url(true);
  };

  const style = () => {
    const maxWidth = clamp(
      (props.customWidth || paneWidth()!) + (props.widthOffset || 0),
      props.maxWidth || 600
    );
    const maxHeight = props.maxHeight
      ? clamp((props.customHeight || height()) / 2, props.maxHeight)
      : (props.customHeight || height()) / 2;
    return clampImageSize(
      props.attachment.width!,
      props.attachment.height!,
      maxWidth,
      maxHeight
    );
  };

  const onClicked = () => {
    if (props.ignoreClick) return;
    createPortal((close) => (
      <ImagePreviewModal
        close={close}
        url={url(true)}
        origUrl={props.attachment.origSrc}
        width={props.attachment.width}
        height={props.attachment.height}
      />
    ));
  };

  return (
    <ImageEmbedContainer
      onclick={onClicked}
      class={classNames(
        "imageEmbedContainer",
        conditionalClass(isGif() && !hasFocus(), "gif")
      )}
    >
      <img
        data-contextmenu-src={contextMenuSrc()}
        loading="lazy"
        src={url()}
        style={style()}
        alt=""
      />
    </ImageEmbedContainer>
  );
}

export function clamp(num: number, max: number) {
  return num >= max ? max : num;
}

export function clampImageSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
) {
  const aspectRatio = width / height;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  return { width: width + "px", height: height + "px" };
}
