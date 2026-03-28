import style from "./ImageEmbed.module.css";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames, conditionalClass } from "@/common/classNames";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import { RawAttachment } from "@/chat-api/RawData";
import { createSignal, lazy, Show } from "solid-js";
import env from "@/common/env";
import { transitionViewIfSupported } from "@/common/transitionViewIfSupported";
import { Skeleton } from "./skeleton/Skeleton";

const ImagePreviewModal = lazy(() => import("./ImagePreviewModal"));

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
  const { paneWidth, height, shouldAnimate } = useWindowProperties();
  const { createPortal } = useCustomPortal();
  const [previewModalOpened, setPreviewModalOpened] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);

  const isGif = () =>
    props.attachment.path?.endsWith(".gif") ||
    props.attachment.path?.endsWith("#a");

  const url = (ignoreFocus?: boolean) => {
    const url = new URL(`${env.NERIMITY_CDN}${props.attachment.path}`);
    if (ignoreFocus) return url.href;
    if (!isGif()) return url.href;

    if (!shouldAnimate(hovered())) {
      url.searchParams.set("type", "webp");
    }
    return url.href;
  };

  const isKlipy = () =>
    props.attachment.origSrc?.startsWith("https://static.klipy.com");

  const contextMenuSrc = () => {
    return props.attachment.origSrc || url(true);
  };

  const styles = () => {
    const maxWidth = clamp(
      (props.customWidth || paneWidth()!) + (props.widthOffset || 0),
      props.maxWidth || 600
    );
    const maxHeight = props.maxHeight
      ? clamp((props.customHeight || height()) / 2, props.maxHeight)
      : (props.customHeight || height()) / 2;

    return {
      ...clampImageSize(
        props.attachment.width!,
        props.attachment.height!,
        maxWidth,
        maxHeight
      ),
      ...(previewModalOpened() ? { "view-transition-name": "embed-image" } : {})
    };
  };

  const onClicked = async () => {
    await ImagePreviewModal.preload();
    if (props.ignoreClick) return;
    setPreviewModalOpened(true);
    transitionViewIfSupported(() => {
      setPreviewModalOpened(false);
      createPortal((close) => (
        <ImagePreviewModal
          close={() => {
            transitionViewIfSupported(() => {
              close();
              setPreviewModalOpened(true);
              setTimeout(() => {
                setPreviewModalOpened(false);
              }, 100);
            });
          }}
          url={url(true)}
          origUrl={props.attachment.origSrc}
          width={props.attachment.width}
          height={props.attachment.height}
        />
      ));
    });
  };

  return (
    <div
      onClick={onClicked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      class={classNames(
        style.imageEmbedContainer,
        "imageEmbedContainer",
        conditionalClass(loaded(), style.loaded),
        conditionalClass(isGif() && !shouldAnimate(hovered()), style.gif)
      )}
    >
      <Show when={!loaded()}>
        <Skeleton.Item class={style.skeleton} style={styles()} />
      </Show>
      <img
        data-contextmenu-src={contextMenuSrc()}
        loading="lazy"
        class={style.image}
        onLoad={() => setLoaded(true)}
        src={url()}
        style={styles()}
        alt=""
      />
      <Show when={isKlipy()}>
        <img class={style.klipy} src="/assets/klipy-light.png" />
      </Show>
    </div>
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
