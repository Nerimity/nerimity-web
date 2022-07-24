import styles from './styles.module.scss';
import Icon from "@/components/ui/icon";

import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { createServer } from '@/chat-api/services/ServerService';
import { createSignal } from 'solid-js';

export default function AddServer() {
  const [name, setName] = createSignal('');
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});

  const onCreateClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: '', path: ''});

    await createServer(name()).catch(setError);
    setRequestSent(false);
  }

  return <div class={styles.addServerContainer}>
    <Icon name="dns" size={30} class={styles.icon} />
    <Input label='Server Name' error={error().message} onText={setName} />
    <Button label='Create Server' iconName='add_circle_outline' onClick={onCreateClick}  />
  </div>
}