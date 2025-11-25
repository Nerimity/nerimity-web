import styles from "./styles.module.scss";
import {
  Show,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import Konva from "konva/lib/Core";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { Vector2d } from "konva/lib/types";
import { Stage } from "konva/lib/Stage";
import { Line as KonvaLine } from "konva/lib/shapes/Line";
import LegacyModal from "../legacy-modal/LegacyModal";
import { useResizeObserver } from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import Button from "../Button";
import { ColorPicker } from "../color-picker/ColorPicker";
import Text from "../Text";
import { t } from "@nerimity/i18lite";


interface PhotoEditorProps {
  src: string;
  close: () => void;
  done: (file: File) => void;
}

const [strokeColor, setStrokeColor] = createSignal("#ff4848");
const [strokeWidth, setStrokeWidth] = createSignal(4);

export default function PhotoEditor(props: PhotoEditorProps) {
  const [el, setEl] = createSignal<HTMLDivElement | undefined>(undefined);
  const { isMobileAgent } = useWindowProperties();
  const { width, height } = useResizeObserver(el);

  const imgLayer = new Konva.Layer();
  const drawLayer = new Konva.Layer();
  let spaceHeld = false;
  let imageDimensions: { width: number; height: number } | undefined;
  let lineHistory: KonvaLine[] = [];

  const [mode, setMode] = createSignal<"brush" | "erase">("brush");

  const handlePinchZoom = (stage: Stage) => {
    function getDistance(p1: Vector2d, p2: Vector2d) {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function getCenter(p1: Vector2d, p2: Vector2d) {
      return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
    }
    let lastCenter: Vector2d | null = null;
    let lastDist = 0;
    let dragStopped = false;

    stage.on("touchmove", function (e) {
      e.evt.preventDefault();
      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];

      // we need to restore dragging, if it was cancelled by multi-touch
      if (touch1 && !touch2 && !stage.isDragging() && dragStopped) {
        stage.startDrag();
        dragStopped = false;
      }

      if (touch1 && touch2) {
        // if the stage was under Konva's drag&drop
        // we need to stop it, and implement our own pan logic with two pointers
        if (stage.isDragging()) {
          dragStopped = true;
          stage.stopDrag();
        }

        const p1 = {
          x: touch1.clientX,
          y: touch1.clientY,
        };
        const p2 = {
          x: touch2.clientX,
          y: touch2.clientY,
        };

        if (!lastCenter) {
          lastCenter = getCenter(p1, p2);
          return;
        }
        const newCenter = getCenter(p1, p2);

        const dist = getDistance(p1, p2);

        if (!lastDist) {
          lastDist = dist;
        }

        // local coordinates of center point
        const pointTo = {
          x: (newCenter.x - stage.x()) / stage.scaleX(),
          y: (newCenter.y - stage.y()) / stage.scaleX(),
        };

        const scale = stage.scaleX() * (dist / lastDist);

        stage.scaleX(scale);
        stage.scaleY(scale);

        // calculate new position of the stage
        const dx = newCenter.x - lastCenter.x;
        const dy = newCenter.y - lastCenter.y;

        const newPos = {
          x: newCenter.x - pointTo.x * scale + dx,
          y: newCenter.y - pointTo.y * scale + dy,
        };

        stage.position(newPos);

        lastDist = dist;
        lastCenter = newCenter;
      }
    });

    stage.on("touchend", function () {
      lastDist = 0;
      lastCenter = null;
    });
  };

  const handleDrawing = (stage: Stage) => {
    let isPaint = false;
    let lastLine: KonvaLine | null = null;

    stage.on("mousedown touchstart", function (e) {
      if (spaceHeld) return;

      if (e.evt.touches?.[1]) {
        lastLine?.remove();
        lineHistory = lineHistory.slice(0, -1);
        return;
      }
      isPaint = true;
      const pos = stage.getRelativePointerPosition()!;
      lastLine = new KonvaLine({
        stroke: strokeColor(),
        // keep scroll width the same size depending on zoom
        strokeWidth: strokeWidth(),
        globalCompositeOperation:
          mode() === "brush" ? "source-over" : "destination-out",
        // round cap for smoother lines
        lineCap: "round",
        lineJoin: "round",
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      });
      lineHistory.push(lastLine);
      drawLayer.add(lastLine);
    });

    stage.on("mouseup touchend", function () {
      isPaint = false;
    });

    // and core function - drawing
    stage.on("mousemove touchmove", function (e) {
      if (!isPaint) {
        return;
      }

      if (e.evt.touches?.[1]) {
        return;
      }

      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = stage.getRelativePointerPosition()!;
      const newPoints = lastLine!.points().concat([pos.x, pos.y]);
      lastLine!.points(newPoints);
    });
  };

  const handleScrollToZoom = (stage: Stage) => {
    const scaleBy = 1.1;
    stage.on("wheel", (e) => {
      // stop default scrolling
      e.evt.preventDefault();

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition()!;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // how to scale? Zoom in? Or zoom out?
      const direction = e.evt.deltaY > 0 ? -1 : 1;

      // when we zoom on trackpad, e.evt.ctrlKey is true
      // in that case lets revert direction
      // if (e.evt.ctrlKey) {
      //   direction = -direction;
      // }

      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
    });
  };

  const handleSpaceToDrag = (stage: Stage) => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        spaceHeld = true;
        stage.setDraggable(true);
      }
    };

    const keyUp = (event: KeyboardEvent) => {
      if (event.key === " ") {
        spaceHeld = false;
        stage.setDraggable(false);
      }
    };
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    onCleanup(() => {
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
    });
  };
  const handleShortcuts = () => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "z" && event.ctrlKey) {
        undo();
      }
    };

    document.addEventListener("keydown", keyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", keyDown);
    });
  };

  let stage: Stage | null = null;
  onMount(() => {
    stage = new Konva.Stage({
      container: el()!,
      width: 500,
      height: 500,
      draggable: false,
    });
    stage.add(imgLayer);
    stage.add(drawLayer);

    handleSpaceToDrag(stage);
    handleShortcuts();
    handlePinchZoom(stage);
    handleDrawing(stage);

    handleScrollToZoom(stage);

    onCleanup(() => {
      stage?.destroy();
    });
  });

  createEffect(
    on(
      () => props.src,
      () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = props.src;
        img.onload = () => {
          imageDimensions = {
            width: img.width,
            height: img.height,
          };

          // scale stage to fit image inside the current width and height
          const scaledImageSize = calculateAspectRatioFit(
            img.width,
            img.height,
            width(),
            height()
          );

          const scaleX = scaledImageSize.width / img.width;
          const scaleY = scaledImageSize.height / img.height;

          stage?.scaleX(scaleX);
          stage?.scaleY(scaleY);

          const scaledImageWidth = img.width * scaleX;
          const scaledImageHeight = img.height * scaleY;

          // set position to center
          stage?.setPosition({
            x: (width() - scaledImageWidth) / 2,
            y: (height() - scaledImageHeight) / 2,
          });
          imgLayer.add(
            new KonvaImage({
              x: 0,
              y: 0,
              image: img,
              width: img.width,
              height: img.height,
            })
          );

          imgLayer.draw();
        };
      }
    )
  );

  createEffect(
    on(width, () => {
      stage?.width(width());
    })
  );

  const onDone = async () => {
    if (lineHistory.length === 0) {
      props.close();
      return;
    }
    stage?.scale({ x: 1, y: 1 });

    const blob = (await stage!.toBlob({
      x: stage?.x()! + imgLayer.x(),
      y: stage?.y()! + imgLayer.y(),
      width: imageDimensions?.width,
      height: imageDimensions?.height,
    })) as Blob;
    const file = new File([blob], "image.png", { type: "image/png" });
    props.done(file);
    props.close();
  };

  const MobileNotices = () => {
    return (
      <div class={styles.notices}>
       <div>{t("photoEditor.mobileNotice")}</div>
      </div>
    );
  };

  const undo = () => {
    lineHistory.at(-1)?.remove();
    lineHistory = lineHistory.slice(0, -1);
  };

  const DesktopNotices = () => {
    return (
      <div class={styles.notices}>
        <div>{t("photoEditor.desktopMove")}</div>
        <div>{t("photoEditor.desktopZoom")}</div>
      </div>
    );
  };

  return (
    <LegacyModal
      actionButtons={isMobileAgent() ? <MobileNotices /> : <DesktopNotices />}
      title={t("photoEditor.title")}
      class={styles.modal}
      close={props.close}
      actionButtonsArr={[
        {
          iconName: "close",
          label: t("photoEditor.cancel"),
          onClick: props.close,
          color: "var(--alert-color)",
        },
        { iconName: "check", label: t("photoEditor.edit"), onClick: onDone },
      ]}
      ignoreBackgroundClick
    >
      <div ref={setEl} class={styles.editorContainer} />

      <div class={styles.buttons}>
        <Button
          hoverText={t("photoEditor.undo")}
          onClick={undo}
          iconName="undo"
          margin={0}
        />
        <Button
          hoverText={t("photoEditor.brush")}
          onClick={() => setMode("brush")}
          primary={mode() === "brush"}
          iconName="brush"
          margin={0}
        />
        <Button
          hoverText={t("photoEditor.erase")}
          onClick={() => setMode("erase")}
          primary={mode() === "erase"}
          iconName="ink_eraser"
          margin={0}
        />

       <Show when={mode() === "brush"}>
          <ColorPicker alpha color={strokeColor()} onChange={setStrokeColor} />
        </Show>
        <div class={styles.strokeWidth}>
          <Text style={{ "margin-left": "2px" }} size={12} opacity={0.8}>
            {t("photoEditor.strokeWidth", { width: strokeWidth() })}
          </Text>

          <input
            type="range"
            min="1"
            max="100"
            onInput={(e) => {
              setStrokeWidth(parseInt(e.target.value));
            }}
            title="Stroke Width"
            value={strokeWidth()}
          />
        </div>
      </div>
    </LegacyModal>
  );
}

function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

  return { width: srcWidth * ratio, height: srcHeight * ratio };
}
