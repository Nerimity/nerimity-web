import Icon from "../icon/Icon";
import styles from "./styles.module.scss";

import "@melloware/coloris/dist/coloris.css";
import { coloris, init, updatePosition } from "@melloware/coloris";
import { createEffect, on, onMount, Show } from "solid-js";
import LegacyModal from "../legacy-modal/LegacyModal";
import { useCustomPortal } from "../custom-portal/CustomPortal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames, conditionalClass } from "@/common/classNames";
import { t } from "@nerimity/i18lite";

init();

function toHex(color: string): string {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return color;

  ctx.fillStyle = color;
  const computed = ctx.fillStyle;

  if (computed.startsWith("#")) {
    return computed.length === 4
      ? "#" +
          computed[1] +
          computed[1] +
          computed[2] +
          computed[2] +
          computed[3] +
          computed[3]
      : computed;
  }

  const rgbaMatch = computed.match(
    /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/
  );
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a =
      rgbaMatch[4] !== undefined
        ? Math.round(parseFloat(rgbaMatch[4]) * 255)
        : 255;

    return (
      "#" +
      r.toString(16).padStart(2, "0") +
      g.toString(16).padStart(2, "0") +
      b.toString(16).padStart(2, "0") +
      (a < 255 ? a.toString(16).padStart(2, "0") : "")
    );
  }
  return computed;
}

function normalizeColor(input: string): string {
  const val = input.trim();
  if (!val) return "#000000";

  if (/^[0-9a-fA-F]{3,8}$/.test(val)) return "#" + val;

  return toHex(val) || "#000000";
}

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
}) {
  const { createPortal } = useCustomPortal();

  let timeout: null | number = null;

  const onChange = (color: string) => {
    clearTimeout(timeout || 0);
    timeout = window.setTimeout(() => {
      props.onChange?.(normalizeColor(color));
    }, 10);
  };

  const onClicked = () => {
    createPortal?.((close) => (
      <ColorPickerModal
        alpha={props.alpha}
        color={props.color}
        close={close}
        onChange={onChange}
        done={props.onDone}
      />
    ));
  };

  props.ref?.({
    openModal: onClicked,
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
  done?: (color: string) => void;
  close: () => void;
  onChange: (value: string) => void;
  alpha?: boolean;
}) => {
  const { isMobileWidth, width } = useWindowProperties();
  let color = normalizeColor(props.color || "#000000");

  const onChange = (newVal: string) => {
    const normalized = normalizeColor(newVal);
    props.onChange(normalized);
    color = normalized;
  };

  const initColoris = () =>
    coloris({
      themeMode: "dark",
      alpha: props.alpha,
      parent: "#coloris",
      defaultColor: color,
      inline: true,
      onChange,
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
    props.done?.(color!);
  };

  return (
    <LegacyModal
      title={t("colorPickerModal.title")}
      close={props.close}
      ignoreBackgroundClick
      actionButtonsArr={[
        {
          label: t("colorPickerModal.done"),
          onClick: done,
          iconName: "check",
          primary: true,
        },
      ]}
    >
      <div
        class={classNames(
          styles.colorPickerContainer,
          conditionalClass(isMobileWidth(), styles.mobile)
        )}
      >
        <div id="coloris" />
      </div>
    </LegacyModal>
  );
};
