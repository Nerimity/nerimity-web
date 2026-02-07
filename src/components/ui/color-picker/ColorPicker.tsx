import Icon from "../icon/Icon";
import styles from "./styles.module.scss";

import "@melloware/coloris/dist/coloris.css";
import { coloris, init, updatePosition } from "@melloware/coloris";
import { createEffect, createSignal, For, on, onMount, Show } from "solid-js";
import LegacyModal from "../legacy-modal/LegacyModal";
import { useCustomPortal } from "../custom-portal/CustomPortal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import { t } from "@nerimity/i18lite";
import { Modal } from "../modal";
import { ColorStop, parseGradient } from "@/common/color";
import { Item } from "../Item";

init();

export interface ColorPickerRef {
  openModal: () => void;
}

export function ColorPicker(props: {
  color: string | null;
  onChange?: (value: string) => void;
  onDone?: (value: string) => void;
  hide?: boolean;
  ref?: ColorPickerRef | undefined;
  alpha?: boolean;
  tabs?: ("gradient" | "solid")[];
}) {
  const { createPortal } = useCustomPortal();

  let timeout: null | number = null;

  const onChange = (color: string) => {
    clearTimeout(timeout || 0);
    timeout = window.setTimeout(() => {
      props.onChange?.(color);
    }, 10);
  };

  const onClicked = () => {
    createPortal?.((close) => (
      <ColorPickerModal
        alpha={props.alpha}
        color={props.color}
        close={close}
        onChange={onChange}
        tabs={props.tabs}
        done={props.onDone}
      />
    ));
  };

  props.ref?.({
    openModal: onClicked
  });

  return (
    <Show when={!props.hide}>
      <div
        class={styles.colorPicker}
        style={{ background: props.color || "transparent" }}
        onClick={onClicked}
      >
        <Icon name="colorize" color="white" size={18} class={styles.icon} />
      </div>
    </Show>
  );
}

export const ColorPickerModal = (props: {
  color: string | null;
  done?: (color: string, colors: string[]) => void;
  close: () => void;
  onChange: (value: string) => void;
  alpha?: boolean;
  stopLimit?: number;
  tabs?: ("gradient" | "solid")[];
}) => {
  let inputRef: HTMLInputElement | undefined;
  const { isMobileWidth, width } = useWindowProperties();
  let color = props.color || "#000000";
  const [currentTab, setCurrentTab] = createSignal<"gradient" | "solid">(
    props.color?.startsWith("linear-gradient") ? "gradient" : "solid"
  );

  const parsedGradient = () =>
    parseGradient(
      props.color?.startsWith("linear-gradient")
        ? props.color!
        : `linear-gradient(90deg, ${props.color || "#ff0000"} 0%, #000000 100%)`
    );

  const [stops, setStops] = createSignal<ColorStop[]>(
    parsedGradient()?.stops || []
  );

  const [selectedGradientIndex, setSelectedGradientIndex] = createSignal(0);

  const onChange = (newVal: string) => {
    if (currentTab() === "gradient") {
      setStops(
        stops().map((s, i) =>
          i === selectedGradientIndex() ? { ...s, color: newVal } : s
        )
      );
      const newGradient = `linear-gradient(90deg, ${stops()
        .map((s) => `${s.color} ${s.percent}%`)
        .join(", ")})`;

      props.onChange(newGradient);
      return;
    }
    props.onChange(newVal);
    color = newVal;
  };

  createEffect(
    on(selectedGradientIndex, () => {
      color = stops()[selectedGradientIndex()]?.color!;
      onChange(color);
      initColoris();
    })
  );

  createEffect(
    on(currentTab, () => {
      if (currentTab() === "gradient") {
        color = stops()[selectedGradientIndex()]?.color!;
        initColoris();
        onChange(color);
      } else {
        color = parsedGradient().stops[0]?.color || props.color || "#000000";
        initColoris();
        onChange(color);
      }
    })
  );

  const initColoris = () =>
    coloris({
      themeMode: "dark",
      alpha: props.alpha,
      parent: "#coloris",
      el: inputRef!,

      defaultColor: color,
      inline: true,
      onChange
    });

  onMount(() => {
    initColoris();
    setTimeout(() => updatePosition(), 250);
  });

  let timeout: null | number = null;
  createEffect(
    on(width, () => {
      clearTimeout(timeout || 0);
      timeout = window.setTimeout(initColoris, 100);
    })
  );

  const done = () => {
    props.close();
    if (currentTab() === "gradient") {
      const newGradient = `linear-gradient(90deg, ${stops()
        .map((s) => `${s.color} ${s.percent}%`)
        .join(", ")})`;

      props.done?.(
        newGradient,
        stops().map((s) => s.color)
      );
      return;
    }
    props.done?.(color!, [color]);
  };

  return (
    <Modal.Root
      close={props.close}
      doNotCloseOnBackgroundClick
      desktopClass={styles.desktopModalStyle}
      desktopMaxWidth={500}
    >
      <Modal.Header title={t("colorPickerModal.title")} icon="colorize" />
      <Modal.Body>
        <div
          class={classNames(
            styles.colorPickerContainer,
            conditionalClass(isMobileWidth(), styles.mobile)
          )}
        >
          <Show when={props.tabs?.length}>
            <div class={styles.tabs}>
              <Item.Root
                handlePosition="bottom"
                selected={currentTab() === "solid"}
                onClick={() => setCurrentTab("solid")}
              >
                <Item.Label>Solid</Item.Label>
              </Item.Root>
              <Item.Root
                handlePosition="bottom"
                selected={currentTab() === "gradient"}
                onClick={() => setCurrentTab("gradient")}
              >
                <Item.Label>Gradient</Item.Label>
              </Item.Root>
            </div>
          </Show>
          <Show when={props.tabs?.length && currentTab() === "gradient"}>
            <GradientSlider
              stops={stops()}
              stopLimit={props.stopLimit}
              selectedIndex={selectedGradientIndex()}
              onChange={(stops, index) => {
                if (index !== undefined) {
                  setSelectedGradientIndex(index);
                }
                setStops(stops);
                props.onChange(
                  `linear-gradient(90deg, ${stops
                    .map((s) => `${s.color} ${s.percent}%`)
                    .join(", ")})`
                );
              }}
            />
          </Show>
          <div id="coloris" />
          <input type="text" ref={inputRef} style={{ display: "none" }} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("general.doneButton")}
          onClick={done}
          iconName="check"
          primary
        />
      </Modal.Footer>
    </Modal.Root>
  );
};

const GradientSlider = (props: {
  stops: ColorStop[];
  onChange: (stops: ColorStop[], selectedIndex?: number) => void;
  selectedIndex?: number;
  stopLimit?: number;
}) => {
  let sliderRef: HTMLDivElement | undefined;
  let draggingIndex = -1;

  const gradient = () => {
    return `linear-gradient(90deg, ${props.stops
      .map((s) => `${s.color} ${s.percent}%`)
      .join(", ")})`;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (draggingIndex === -1 || !sliderRef) return;

    const rect = sliderRef.getBoundingClientRect();

    const relativeX = e.clientX - rect.left;

    let percent = Math.round((relativeX / rect.width) * 100);
    percent = Math.max(0, Math.min(100, percent));

    const newStops = [...props.stops];
    newStops[draggingIndex] = {
      ...newStops[draggingIndex]!,
      percent: percent
    };

    props.onChange(newStops);
  };

  const onMouseUp = () => {
    document.removeEventListener("pointermove", onMouseMove);
    document.removeEventListener("pointerup", onMouseUp);
    draggingIndex = -1;
  };

  const handleClick = (e: MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    draggingIndex = index;
    props.onChange(props.stops, index);

    document.addEventListener("pointerup", onMouseUp);
    document.addEventListener("pointermove", onMouseMove);
  };

  const onContainerClick = (e: MouseEvent) => {
    if (e.currentTarget !== e.target) return;
    if (!sliderRef) return;
    if (props.stopLimit) {
      if (props.stops.length >= props.stopLimit) return;
    }

    const rect = sliderRef.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    let percent = Math.round((relativeX / rect.width) * 100);
    percent = Math.max(0, Math.min(100, percent));

    const newStop = { color: "#000000", percent: percent };

    const insertIndex = props.stops.findIndex((stop) => stop.percent > percent);

    const updatedStops = [...props.stops];

    if (insertIndex === -1) {
      updatedStops.push(newStop);
    } else {
      updatedStops.splice(insertIndex, 0, newStop);
    }

    props.onChange(updatedStops, insertIndex);
  };
  const removeStop = (index: number) => {
    if (props.stops.length <= 2) return;
    const newStops = [...props.stops];
    newStops.splice(index, 1);
    props.onChange(newStops);
  };

  return (
    <div class={styles.gradientSlider} ref={sliderRef!}>
      <div
        class={styles.gradientSliderInner}
        style={{ background: gradient() }}
        onClick={onContainerClick}
      />
      <For each={props.stops}>
        {(stop, i) => (
          <div
            class={cn(
              styles.colorStop,
              props.selectedIndex === i() && styles.active
            )}
            style={{
              left: `${stop.percent}%`,
              background: stop.color,
              position: "absolute",
              transform: "translateX(-50%)"
            }}
            onPointerDown={(e) => handleClick(e, i())}
          >
            <Show when={props.selectedIndex === i() && props.stops.length > 2}>
              <div class={styles.removeButton} onClick={() => removeStop(i())}>
                <Icon name="close" size={12} />
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};
