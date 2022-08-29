import styles from './styles.module.scss'
import useStore from "@/chat-api/store/useStore";
import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createSignal, on } from "solid-js";
import Button from '../button';
import Input from '../input';

export default function DeleteConfirmModal(props: {confirmText: string, errorMessage?: string | null, onDeleteClick?: () => void}) {
  const [confirmInput, setConfirmInput] = createSignal();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);


  createEffect(on(() => props.errorMessage, () => {
    setError(props.errorMessage || null);
    if (props.errorMessage) {
      setRequestSent(false);
    }
  }))

  
  const onDeleteClick = async () => {
    setError(null);
    if (confirmInput() !== props.confirmText) {
      setError(`Input did not match "${props.confirmText}".`);
      return;
    }
    if (requestSent()) return;
    setRequestSent(true);

    props.onDeleteClick?.()
  }

  const buttonMessage = () => requestSent() ? 'Deleting...' : `Delete ${props.confirmText}`;

  
  return (
    <div class={styles.deleteConfirmModal}>
      <div>Confirm by typing <span class={styles.highlight}>{props.confirmText}</span> in the box below.</div>
      <Input error={error()} onText={v => setConfirmInput(v)} />
      <Button class={styles.button} iconName='delete' label={buttonMessage()} color="var(--alert-color)" onClick={onDeleteClick} />
    </div>
  )
}