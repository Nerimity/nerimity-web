import { onMount, createSignal, onCleanup } from "solid-js";
import LegacyModal from "./legacy-modal/LegacyModal";
import Croppie, { CropData } from "croppie";
import "croppie/croppie.css";
import Button from "./Button";
import { t } from "@nerimity/i18lite";
import { debounce } from "@/common/debounce";

export default function ImageCropModal(props: {
  close(): void;
  image: string;
  onCropped(points: number[]): void;
  type?: "avatar" | "banner";
}) {
  let imageEl: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  let croppie: Croppie | undefined;

  // We use a signal to track the available width for responsive calc
  const [containerWidth, setContainerWidth] = createSignal(500);

  const initCroppie = (width: number) => {
    if (!imageEl) return;

    // Cleanup old instance if it exists
    if (croppie) {
      croppie.destroy();
    }

    const isBanner = props.type === "banner";
    const padding = 40;
    const availableWidth = width - padding;

    // Calculate viewport size to fit the screen
    // If it's a banner (400x150), we maintain a 2.66 aspect ratio
    // If it's an avatar (300x300), we keep it square
    const vw = isBanner
      ? Math.min(400, availableWidth)
      : Math.min(300, availableWidth);
    const vh = isBanner ? vw / 2.66 : vw;

    croppie = new Croppie(imageEl, {
      viewport: {
        type: isBanner ? "square" : "circle",
        width: vw,
        height: vh,
      },
      boundary: {
        width: "100%",
        height: 400,
      },
      showZoomer: true,
      enableOrientation: true,
      enforceBoundary: true, // This prevents the "escaping into void"
    });

    croppie.bind({ url: props.image });

    imageEl.addEventListener(
      "update",
      debounce((ev) => {
        const result = (ev as any).detail as CropData;
        if (result?.points) {
          props.onCropped(result.points.map((v) => parseInt(v as any)));
        }
      }, 50)
    );
  };

  onMount(() => {
    if (!containerRef) return;

    // Observe size changes to re-init if the window resizes significantly
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (Math.abs(newWidth - containerWidth()) > 50) {
          setContainerWidth(newWidth);
          initCroppie(newWidth);
        }
      }
    });

    ro.observe(containerRef);
    initCroppie(containerRef.clientWidth);

    onCleanup(() => {
      ro.disconnect();
      croppie?.destroy();
    });
  });

  const onClick = () => {
    const result = croppie?.get();
    if (result?.points) {
      props.onCropped(result.points.map((v) => parseInt(v as any)));
    }
    props.close();
  };

  return (
    <LegacyModal
      title={t("imageCropModal.title")}
      close={props.close}
      maxWidth={550}
      actionButtons={
        <Button
          iconName="check"
          label={t("imageCropModal.done")}
          onClick={onClick}
          styles={{ flex: 1 }}
          primary
          padding={10}
        />
      }
    >
      <div
        ref={containerRef}
        style={{
          "user-select": "none",
          width: "100%",
          "min-height": "450px",
          "margin-bottom": "20px",
        }}
      >
        <div ref={imageEl!} />
      </div>
    </LegacyModal>
  );
}
