import styles from './styles.module.scss';

import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { createSignal } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Modal from '@/components/ui/modal/Modal';
import { FlexRow } from '@/components/ui/Flexbox';
import { t } from 'i18next';

export default function AddFriendModal(props: {close: () => void}) {
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

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button class={styles.button} label='Send Request' iconName='add_circle_outline' onClick={onCreateClick}  />
    </FlexRow>
  )


  return (
    <Modal close={props.close} icon="group_add" title="Add Friend" actionButtons={ActionButtons}>
      <div class={styles.addFriendContainer}>
        <Input label={t('addFriend.usernameAndTag')} error={error().message} onText={setUserTag} />
        {success() && <div style="color: var(--success-color)">Friend successfully added!</div>}
      </div>
    </Modal>
  )
}