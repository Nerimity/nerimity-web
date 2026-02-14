import styles from "./styles.module.scss";
import { JSXElement, Show, createEffect, createSignal, on } from "solid-js";
import Button from "../Button";
import Input from "../input/Input";
import LegacyModal from "../legacy-modal/LegacyModal";
import { FlexRow } from "../Flexbox";

interface Props {
  confirmText?: string;
  errorMessage?: string | null;
  onDeleteClick?: (value?: string) => Promise<string | undefined | void> | void;
  close: () => void;
  password?: boolean;
  icon?: string;
  buttonText?: {
    main: string;
    loading: string;
  };
  title: string;
  custom?: JSXElement;
}

export default function DeleteConfirmModal(props: Props) {
  const [confirmInput, setConfirmInput] = createSignal("");
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);

  createEffect(
    on(
      () => props.errorMessage,
      () => {
        setError(props.errorMessage || null);
        if (props.errorMessage) {
          setRequestSent(false);
        }
      }
    )
  );

  const onDeleteClick = async () => {
    setError(null);
    if (props.confirmText || props.password) {
      if (!props.password && confirmInput() !== props.confirmText) {
        setError(`Input did not match "${props.confirmText}".`);
        return;
      }
    }
    if (requestSent()) return;
    setRequestSent(true);

    const err = await props.onDeleteClick?.(confirmInput());
    if (err) {
      setError(err);
      setRequestSent(false);
      return;
    }
    props.close();
  };

  const buttonMessage = () =>
    requestSent()
      ? props.buttonText?.loading || "Deleting..."
      : props.buttonText?.main || `Delete ${props.confirmText}`;

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        class={styles.button}
        iconName={props.icon || "delete"}
        label={buttonMessage()}
        color="var(--alert-color)"
        primary
        onClick={onDeleteClick}
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={props.title}
      icon={props.icon || "delete"}
      color="var(--alert-color)"
      actionButtons={ActionButtons}
      maxWidth={400}
    >
      <div class={styles.deleteConfirmModal}>
        <Show when={props.custom}>{props.custom!}</Show>
        <Show when={props.confirmText || props.password}>
          <Show when={!props.password}>
            <div class={styles.confirmText}>
              Confirm by typing{" "}
              <span class={styles.highlight}>{props.confirmText}</span> in the
              box below.
            </div>
          </Show>
          <Show when={props.password}>
            <div class={styles.confirmText}>
              Confirm by typing your password in the box below.
            </div>
          </Show>
          <Input
            type={props.password ? "password" : "text"}
            error={error()}
            onText={(v) => setConfirmInput(v)}
            onEnter={onDeleteClick}
            autofocus
          />
        </Show>
      </div>
    </LegacyModal>
  );
}
