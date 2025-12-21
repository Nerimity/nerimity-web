import { onMount } from "solid-js";
import LegacyModal from "./legacy-modal/LegacyModal";
import Croppie, { CropData } from "croppie";
import "croppie/croppie.css";
import Button from "./Button";
import { t } from "@nerimity/i18lite";

export default function ImageCropModal(props: {
  close(): void;
  image: string;
  onCropped(points: number[]): void;
  type?: "avatar" | "banner";
}) {
  let imageEl: undefined | HTMLImageElement;
  let croppie: Croppie | undefined;

  onMount(() => {
    if (!imageEl) return;

    const isBanner = props.type === "banner";

    croppie = new Croppie(imageEl, {
      viewport: {
        type: isBanner ? "square" : "circle",
        width: isBanner ? 400 : 300,
        height: isBanner ? 150 : 300,
      },
      boundary: {
        width: "100%",
        height: 400,
      },
    });
    croppie.bind({
      url: props.image,
    });

    imageEl.addEventListener("update", (ev) => {
      if (!("detail" in ev)) return;
      const result = ev.detail as CropData;
      if (!result || !result.points) return;
      const pointsToInt = result.points.map((v) =>
        parseInt(v as unknown as string)
      );

      props.onCropped(pointsToInt);
    });
  });

  const onClick = () => {
    const result = croppie?.get();
    if (!result || !result.points) return;

    const pointsToInt = result.points.map((v) =>
      parseInt(v as unknown as string)
    );
    props.onCropped(pointsToInt);
    props.close();
  };

  const ActionButtons = (
    <Button
      iconName="check"
      label={t("imageCropModal.done")}
      onClick={onClick}
      styles={{ flex: 1 }}
      primary
      padding={10}
    />
  );

  return (
    <LegacyModal
      title={t("imageCropModal.title")}
      close={props.close}
      maxWidth={500}
      actionButtons={ActionButtons}
    >
      <div
        style={{
          "user-select": "none",
          width: "100%",
          height: "400px",
          "margin-bottom": "50px",
        }}
      >
        <div ref={imageEl!} />
      </div>
    </LegacyModal>
  );
}
