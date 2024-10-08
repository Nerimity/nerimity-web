import styles from "./Modal.module.scss";
import { useWindowProperties } from "@/common/useWindowProperties";
import { For, JSX, Show } from "solid-js";
import { Portal } from "solid-js/web";

import Icon from "../icon/Icon";
import Text from "../Text";
import Button, { ButtonProps } from "../Button";
import { classNames, conditionalClass } from "@/common/classNames";

interface Props {
  children: JSX.Element;
  title: string;
  icon?: string;
  actionButtons?: JSX.Element;
  actionButtonsArr?: ButtonProps[];
  close?: () => void;
  ignoreBackgroundClick?: boolean;
  class?: string;
  maxHeight?: number;
  maxWidth?: number;

  color?: string;
}

export default function LegacyModal(props: Props) {
  const { isMobileWidth } = useWindowProperties();

  const modalContainerStyle = () => {
    const s = {} as JSX.CSSProperties;
    if (props.maxWidth) {
      s["max-width"] = `${props.maxWidth}px`;
    }

    if (props.maxHeight) {
      s["max-height"] = `${props.maxHeight}px`;
      s.height = `${isMobileWidth() ? "calc(100% - 20px)" : "100%"}`;
    }

    return s;
  };
  let startClick = { x: 0, y: 0 };
  let textSelected = false;
  const onBackgroundClick = (event: MouseEvent) => {
    if (props.ignoreBackgroundClick) return;
    if (event.target !== event.currentTarget) return;

    const xDistance = Math.abs(startClick.x - event.clientX);
    const yDistance = Math.abs(startClick.y - event.clientY);

    const clickedPos = xDistance > 3 || yDistance > 3;
    if (clickedPos || textSelected) {
      return;
    }

    props.close?.();
  };

  const onMouseDown = (event: MouseEvent) => {
    startClick = {
      x: event.clientX,
      y: event.clientY,
    };
    textSelected = !!window.getSelection()?.toString();
  };
  return (
    <Portal>
      <div
        class={classNames(styles.backgroundContainer, "modal-bg")}
        onClick={onBackgroundClick}
        onMouseDown={onMouseDown}
      >
        <div
          style={modalContainerStyle()}
          classList={{
            modal: true,
            [props.class || ""]: true,
            [styles.modalContainer!]: true,
            [styles.mobile!]: isMobileWidth(),
          }}
        >
          <div class={styles.header}>
            <Show when={props.icon}>
              <Icon
                class={styles.icon}
                onClick={props.close}
                name={props.icon}
                color={props.color || "var(--primary-color)"}
                size={24}
              />
            </Show>
            <div class={styles.title} style={{ color: props.color }}>
              {props.title}
            </div>
            <Show when={props.close}>
              <Button
                class={styles.closeButton}
                color="var(--alert-color)"
                onClick={props.close}
                iconName="close"
                iconSize={16}
              />
            </Show>
          </div>
          <div class={styles.body}>{props.children}</div>
          <div style={styles.actionButtons}>
            <Show when={props.actionButtonsArr}>
              <div
                class={classNames(
                  styles.actionButtonInnerContainer,
                  isMobileWidth() ? styles.mobile : undefined
                )}
              >
                <For each={props.actionButtonsArr}>
                  {(actionButton) => <Button {...actionButton} />}
                </For>
              </div>
            </Show>
            {props.actionButtons}
          </div>
        </div>
      </div>
    </Portal>
  );
}
