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
  let mouseDownTarget: HTMLDivElement | null = null;

  const modalContainerStyle = () =>
    ({
      ...(props.maxWidth
        ? {
            "max-width": `${props.maxWidth}px`,
          }
        : {}),

      ...(props.maxHeight
        ? {
            "max-height": `${props.maxHeight}px`,
            height: `${isMobileWidth() ? "calc(100% - 20px)" : "100%"}`,
          }
        : {}),
    } as JSX.CSSProperties);

  const onBackgroundClick = (event: MouseEvent) => {
    if (props.ignoreBackgroundClick) return;
    if (mouseDownTarget?.closest(".modal")) return;
    props.close?.();
  };
  return (
    <Portal>
      <div
        class={classNames(styles.backgroundContainer, "modal-bg")}
        onClick={onBackgroundClick}
        onMouseDown={(e) => (mouseDownTarget = e.target as HTMLDivElement)}
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
