import { useWindowProperties } from "@/common/useWindowProperties";
import { FlexRow } from "./Flexbox";
import { styled } from "solid-styled-components";
import { classNames, conditionalClass } from "@/common/classNames";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { RawAttachment } from "@/chat-api/RawData";


const ImageEmbedContainer = styled(FlexRow)`
  user-select: none;
  overflow: hidden;
  position: relative;
  align-self: flex-start;
  margin-top: 5px;
  cursor: pointer;

  img {
    border-radius: 8px;
  }

  &.gif:after {
    content: "GIF";
    position: absolute;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 5px;
    top: 10px;
    left: 10px;
  }
`

export function ImageEmbed(props: { attachment: RawAttachment, widthOffset?: number, customWidth?: number, customHeight?: number}) {
  const { paneWidth, height, hasFocus } = useWindowProperties();
  const { createPortal } = useCustomPortal();
  
  const isGif = () => props.attachment.path.endsWith(".gif")
  const url = (ignoreFocus?: boolean) => {
    let url = `https://cdn.nerimity.com/${props.attachment.path}`;
    if (ignoreFocus) return url;
    if (!isGif()) return url;
    if (!hasFocus()) url += "?type=webp";
    return url;
  }

  const style = () => {
    const maxWidth = clamp((props.customWidth || paneWidth()!) + (props.widthOffset || 0), 600)
    return clampImageSize(props.attachment.width!, props.attachment.height!, maxWidth, (props.customHeight || height()) / 2)
  }

  const onClicked = () => {
    createPortal(close => <ImagePreviewModal close={close} url={url(true)} width={props.attachment.width} height={props.attachment.height} />)
  }

  return (
    <ImageEmbedContainer onclick={onClicked} class={classNames("imageEmbedContainer", conditionalClass(isGif() && !hasFocus(), "gif"))}>
      <img loading="lazy" src={url()} style={style()} alt="" />
    </ImageEmbedContainer>
  )
}


const ImagePreviewContainer = styled(FlexRow)`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  inset: 0;
  z-index: 111111111111;
  background: rgba(0,0,0,0.9);
  img {
    border-radius: 8px;
  }
`;


export function ImagePreviewModal(props: { close: () => void, url: string, width?: number, height?: number }) {
  const { width, height } = useWindowProperties();

  const style = () => {
    const maxWidth = clamp(width(), width() / 100 * 80);
    const maxHeight = clamp(height(), height() / 100 * 80);
    return clampImageSize(props.width!, props.height!, maxWidth, maxHeight)
  }

  const onClick = (event: any) => {
    const target = event.target as HTMLDivElement;
    if (!target.classList.contains("ImagePreviewContainer")) return;
    props.close()
  }

  return (
    <ImagePreviewContainer onclick={onClick} class="ImagePreviewContainer">
      <img src={props.url} style={style()}></img>
    </ImagePreviewContainer>
  )
}


export function clamp(num: number, max: number) {
  return num >= max ? max : num;
}


function clampImageSize(width: number, height: number, maxWidth: number, maxHeight: number) {
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
