import {} from "@/common/useWindowProperties";
import { createEffect, on, onCleanup, onMount } from "solid-js";
import { css, styled } from "solid-styled-components";
import { FlexRow } from "./Flexbox";
import "zoomist/css";
import Zoomist from "zoomist";
import { useLocation, useNavigate } from "solid-navigator";
import Button from "./Button";
import { DangerousLinkModal } from "./DangerousLinkModal";
import { useCustomPortal } from "./custom-portal/CustomPortal";
import env from "@/common/env";
const ImagePreviewContainer = styled(FlexRow)`
  position: absolute;
  display: flex;
  flex-direction: column;
  inset: 0;
  z-index: 111111111111;
  background: rgba(0, 0, 0, 0.9);
  user-select: none;
  touch-action: none;

  .zoomist-container {
    width: 100%;
    height: 100%;
  }

  .zoomist-image {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: black;
  }

  img {
    max-width: 100%;
    max-height: 100%;
  }
`;
const ImagePreview = styled(FlexRow)`
  align-items: center;
  justify-content: center;
  flex: 1;
  overflow: hidden;
`;
const InfoContainer = styled(FlexRow)`
  background-color: var(--pane-color);
  padding: 4px;
  align-items: center;
  justify-content: center;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  border-top: solid 1px rgba(255, 255, 255, 0.2);
  z-index: 11111;
`;

export function ImagePreviewModal(props: {
  close: () => void;
  url: string;
  origUrl?: string;
  width?: number;
  height?: number;
}) {
  let imageRef: HTMLImageElement | undefined;
  let zoomistContainerRef: HTMLImageElement | undefined;
  let location = useLocation();
  let navigate = useNavigate();
  const { createPortal } = useCustomPortal();

  createEffect(
    on(
      () => location.pathname + location.search + location.hash,
      () => {
        if (location.hash !== "#image-preview") {
          props.close();
          history.forward();
          setTimeout(() => {
            navigate(location.pathname + location.search, { replace: true });
          }, 100);
        }
      },
      { defer: true }
    )
  );

  onMount(() => {
    navigate("#image-preview");

    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") props.close();
  };

  onMount(() => {
    const zoomist = new Zoomist(zoomistContainerRef!, {
      bounds: true,
    });

    onCleanup(() => {
      zoomist.destroy();
    });
  });

  const openOriginalLink = () => {
    const url = props.origUrl || props.url;
    if (url.startsWith(env.NERIMITY_CDN)) {
      window.open(url, "_blank");
      return;
    }
    createPortal((c) => <DangerousLinkModal close={c} unsafeUrl={url} />);
  };

  let pos = { x: 0, y: 0 };
  const onMouseDown = (event: MouseEvent) => {
    pos = { x: event.x, y: event.y };
  };

  const onMouseUp = (event: MouseEvent) => {
    if (event.target instanceof HTMLImageElement) return;
    if (pos.x === event.x && pos.y === event.y) {
      navigate(location.pathname + location.search, { replace: true });
    }
  };

  return (
    <ImagePreviewContainer>
      <ImagePreview onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
        <div class="zoomist-container" ref={zoomistContainerRef}>
          <div class="zoomist-wrapper">
            <div class="zoomist-image">
              <img draggable={false} ref={imageRef} src={props.url} />
            </div>
          </div>
        </div>
      </ImagePreview>
      <InfoContainer gap={8}>
        <Button
          onClick={() =>
            navigate(location.pathname + location.search, { replace: true })
          }
          iconName="close"
          margin={0}
          color="var(--alert-color)"
          padding={8}
        />
        <Button
          onClick={openOriginalLink}
          iconName="open_in_new"
          margin={0}
          padding={8}
        />
        <Button
          onClick={() => copyClipboard(props.url)}
          iconName="content_copy"
          margin={0}
          padding={8}
        />
      </InfoContainer>
    </ImagePreviewContainer>
  );
}

function copyClipboard(imgSrc: string) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imgSrc;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, img.width, img.height);
    canvas.toBlob((blob) => {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob! })]);
    }, "image/png");
  };
}
