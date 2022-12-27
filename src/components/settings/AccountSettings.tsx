import { createEffect, createSignal, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { updateUser } from '@/chat-api/services/UserService';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function AccountSettings() {
  const {header, account} = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);

  const user = () => account.user();

  const defaultInput = () => ({
    email: user()?.email || '',
    username: user()?.username || '',
    tag: user()?.tag || '',
    password: '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);



  createEffect(() => {
    header.updateHeader({
      title: "Settings - Account",
      iconName: 'settings',
    });
  })

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateUser(values)
      .then(() => setInputValue("password", ''))
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))

  }

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';


  return (
    <Container>     
      <SettingsBlock icon='edit' label='Email'>
        <Input value={inputValues().email} onText={(v) => setInputValue('email', v) } />
      </SettingsBlock>

      <SettingsBlock icon='edit' label='Username'>
        <Input value={inputValues().username} onText={(v) => setInputValue('username', v) } />
      </SettingsBlock>

      <SettingsBlock icon='edit' label='Tag'>
        <Input class={css`width: 52px;`} value={inputValues().tag} onText={(v) => setInputValue('tag', v) } />
      </SettingsBlock>

      <Show when={Object.keys(updatedInputValues()).length}>
        <SettingsBlock icon='edit' label='Confirm Password'>
          <Input type='password' value={inputValues().password} onText={(v) => setInputValue('password', v) } />
        </SettingsBlock>
      </Show>

      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{"margin-top": "5px"}}>{error()}</Text></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
      </Show>
    </Container>
  )
}