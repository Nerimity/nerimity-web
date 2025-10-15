import Icon from "../icon/Icon";
import styles from "./styles.module.scss";

import "@melloware/coloris/dist/coloris.css";
import Coloris, { coloris, init, updatePosition } from "@melloware/coloris";
import {
  Accessor,
  createEffect,
  createSignal,
  on,
  onMount,
  Show,
} from "solid-js";
import LegacyModal from "../legacy-modal/LegacyModal";
import { useCustomPortal } from "../custom-portal/CustomPortal";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames, conditionalClass } from "@/common/classNames";

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
  let color = props.color || "#000000";
  const onChange = (newVal: string) => {
    props.onChange(newVal);
    color = newVal;
  };

  const initColoris = () =>
    coloris({
      themeMode: "dark",
      alpha: props.alpha,
      parent: "#coloris",
      defaultColor: props.color || "black",
      inline: true,
      onChange,
    });

  onMount(() => {
    initColoris();
    setTimeout(() => {
      updatePosition();
    }, 100);
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
      title="Color Picker"
      close={props.close}
      ignoreBackgroundClick
      actionButtonsArr={[
        { label: "Done", onClick: done, iconName: "check", primary: true },
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
