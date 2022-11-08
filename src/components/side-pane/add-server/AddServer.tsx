import styles from './styles.module.scss';

import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/button/Button';
import { createServer } from '@/chat-api/services/ServerService';
import { createSignal } from 'solid-js';
import RouterEndpoints from '@/common/RouterEndpoints';
import { useNavigate } from '@nerimity/solid-router';

export default function AddServer(props: {close: () => void}) {
  const navigate = useNavigate();
  const [name, setName] = createSignal('');
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});

  const onCreateClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: '', path: ''});

    const server = await createServer(name()).catch(err => {setError(err)});
    if (server) {
      navigate(RouterEndpoints.SERVER_MESSAGES(server.id, server.defaultChannelId))
      props.close();
    }
    setRequestSent(false);
  }

  return <div class={styles.addServerContainer}>
    <Input label='Server Name' error={error().message} onText={setName} />
    <Button class={styles.button} label='Create Server' iconName='add_circle_outline' onClick={onCreateClick}  />
  </div>
}