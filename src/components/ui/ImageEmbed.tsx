import { useWindowProperties } from "@/common/useWindowProperties";
import { FlexRow } from "./Flexbox";
import { styled } from "solid-styled-components";
import { classNames, conditionalClass } from "@/common/classNames";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { RawAttachment } from "@/chat-api/RawData";
import { createSignal, onCleanup, onMount } from "solid-js";
import env from '@/common/env'


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
`

export function ImageEmbed(props: { attachment: RawAttachment, widthOffset?: number, customWidth?: number, customHeight?: number}) {
  const { paneWidth, height, hasFocus } = useWindowProperties();
  const { createPortal } = useCustomPortal();
  
  const isGif = () => props.attachment.path.endsWith(".gif")
  const url = (ignoreFocus?: boolean) => {
    let url = new URL(`${env.NERIMITY_CDN}${props.attachment.path}`);
    if (ignoreFocus) return url.href;
    if (!isGif()) return url.href;
    if (!hasFocus()) {
      url.searchParams.set("type", "webp")
    }
    return url.href;
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
  const [dimensions, setDimensions] = createSignal({width: props.width, height: props.height})

  onMount(() => {
    document.addEventListener("keydown", onKeyDown)
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown)
    })
  })

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") props.close();
  }

  const style = () => {
    const maxWidth = clamp(width(), width() / 100 * 80);
    const maxHeight = clamp(height(), height() / 100 * 80);
    return clampImageSize(dimensions().width!, dimensions().height!, maxWidth, maxHeight)
  }

  const onClick = (event: any) => {
    const target = event.target as HTMLDivElement;
    if (!target.classList.contains("ImagePreviewContainer")) return;
    props.close()
  }

  const onLoad = (event: {target: HTMLImageElement}) => {
    if (dimensions().width) return;
    setDimensions({
      width: event.target.naturalWidth,
      height: event.target.naturalHeight
    })
  }

  return (
    <ImagePreviewContainer onclick={onClick} class="ImagePreviewContainer">
      <img src={props.url} onload={onLoad} style={style()}></img>
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
