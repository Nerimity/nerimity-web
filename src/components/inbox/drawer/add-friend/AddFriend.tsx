import styles from './styles.module.scss';

import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { createSignal } from 'solid-js';
import useStore from '@/chat-api/store/useStore';

export default function AddFriend() {
  const {friends} = useStore();
  const [userTag, setUserTag] = createSignal('');
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});
  const [success, setSuccess] = createSignal(false);

  const onCreateClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: '', path: ''});
    setSuccess(false);

    const split = userTag().split(':');
    if (split.length <= 1) {
      setError({message: 'Please enter a username:tag.', path: ''});
      setRequestSent(false);
      return;
    }
    if (split.length >= 3) {
      setError({message: 'Username must not contain a colon.', path: ''});
      setRequestSent(false);
      return;
    }
    const username = split[0];
    const tag = split[1];

    await friends.sendRequest(username, tag).then(() => {
      setSuccess(true);
    })
    .catch((err) => {
      setError({message: err.message, path: err.path});
    })
    setRequestSent(false);
  }

  return <div class={styles.addFriendContainer}>
    <Input label='Username & Tag' error={error().message} onText={setUserTag} />
    {success() && <div style="color: var(--success-color)">Friend successfully added!</div>}
    <Button class={styles.button} label='Send Request' iconName='add_circle_outline' onClick={onCreateClick}  />
  </div>
}