import styles from "./styles.module.scss";
import { JSXElement, Show, createEffect, createSignal, on } from "solid-js";
import Button from "../Button";
import Input from "../input/Input";
import LegacyModal from "../legacy-modal/LegacyModal";
import { FlexRow } from "../Flexbox";
import { t } from "i18next";

interface Props {
  confirmText: string;
  errorMessage?: string | null;
  onDeleteClick?: (value?: string) => Promise<string | undefined | void> | void;
  close: () => void;
  password?: boolean;
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
    if (!props.password && confirmInput() !== props.confirmText) {
      setError(t("deletionModal.errorDoNotMatch", { text: props.confirmText }));
      return;
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
    requestSent() ? "Deleting..." : `Delete ${props.confirmText}`;

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        class={styles.button}
        iconName="delete"
        label={buttonMessage()}
        color="var(--alert-color)"
        onClick={onDeleteClick}
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={props.title}
      icon="delete"
      color="var(--alert-color)"
      actionButtons={ActionButtons}
      maxWidth={400}
    >
      <div class={styles.deleteConfirmModal}>
        <Show when={props.custom}>{props.custom!}</Show>
        <Show when={!props.password}>
          <div class={styles.confirmText}>
          {t("deletionModal.confirm", { text: <span class={styles.highlight}>{props.confirmText}</span> })}
          </div>
        </Show>
        <Show when={props.password}>
          <div class={styles.confirmText}>
          {t("deletionModal.confirm", { text: "your password" })}
          </div>
        </Show>
        <Input
          type={props.password ? "password" : "text"}
          error={error()}
          onText={(v) => setConfirmInput(v)}
        />
      </div>
    </LegacyModal>
  );
}
