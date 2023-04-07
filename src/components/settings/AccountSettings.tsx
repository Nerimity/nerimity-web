import { createEffect, createSignal, onCleanup, Setter, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { updateUser } from '@/chat-api/services/UserService';
import FileBrowser, { FileBrowserRef } from '../ui/FileBrowser';
import { reconcile } from 'solid-js/store';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function AccountSettings(props: {updateHeader: Setter<{username?: string, banner?: string; tag?: string, avatar?: any}>}) {
  const {header, account} = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [avatarFileBrowserRef, setAvatarFileBrowserRef] = createSignal<undefined | FileBrowserRef>()
  const [bannerFileBrowserRef, setBannerFileBrowserRef] = createSignal<undefined | FileBrowserRef>()

  const user = () => account.user();

  const defaultInput = () => ({
    email: user()?.email || '',
    username: user()?.username || '',
    tag: user()?.tag || '',
    password: '',
    avatar: '',
    banner: '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);



  createEffect(() => {
    header.updateHeader({
      title: "Settings - Account",
      iconName: 'settings',
    });
  })

  onCleanup(() => {
    props.updateHeader(reconcile({}));
  })

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateUser(values)
      .then(() => {
        setInputValue("password", '')
        setInputValue("avatar", '')
        props.updateHeader(reconcile({}));
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))

  }

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';


  const onAvatarPick = (files: string[]) => {
    if (files[0]) {
      setInputValue("avatar", files[0])
      props.updateHeader({avatar: files[0]})

    }
  }
  const onBannerPick = (files: string[]) => {
    if (files[0]) {
      setInputValue("banner", files[0])
      props.updateHeader({banner: files[0]})

    }
  }


  return (
    <Container>     
      <SettingsBlock icon='email' label='Email'>
        <Input value={inputValues().email} onText={(v) => setInputValue('email', v) } />
      </SettingsBlock>

      <SettingsBlock icon='face' label='Username'>
        <Input value={inputValues().username} onText={(v) => setInputValue('username', v) } />
      </SettingsBlock>

      <SettingsBlock icon='local_offer' label='Tag'>
        <Input class={css`width: 52px;`} value={inputValues().tag} onText={(v) => setInputValue('tag', v) } />
      </SettingsBlock>

      <SettingsBlock icon='wallpaper' label='Avatar'>
        <FileBrowser accept='images' ref={setAvatarFileBrowserRef} base64 onChange={onAvatarPick}/>
        <Show when={inputValues().avatar}>
          <Button margin={0} color='var(--alert-color)' iconSize={18} iconName='close'  onClick={() => {setInputValue("avatar", ""); props.updateHeader({avatar: undefined});}} />
        </Show>
        <Button iconSize={18} iconName='attach_file' label='Browse' onClick={avatarFileBrowserRef()?.open} />
      </SettingsBlock>

      <SettingsBlock icon='panorama' label='Banner'>
        <FileBrowser accept='images' ref={setBannerFileBrowserRef} base64 onChange={onBannerPick}/>
        <Show when={inputValues().banner}>
          <Button margin={0} color='var(--alert-color)' iconSize={18} iconName='close'  onClick={() => {setInputValue("banner", ""); props.updateHeader({banner: undefined});}} />
        </Show>
        <Button iconSize={18} iconName='attach_file' label='Browse' onClick={bannerFileBrowserRef()?.open} />
      </SettingsBlock>

      <Show when={Object.keys(updatedInputValues()).length}>
        <SettingsBlock icon='password' label='Confirm Password'>
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