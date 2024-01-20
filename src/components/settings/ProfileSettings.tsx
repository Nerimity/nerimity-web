import { createEffect, createSignal, on, onCleanup, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { getUserDetailsRequest, updateUser, UserDetails } from '@/chat-api/services/UserService';
import { reconcile } from 'solid-js/store';
import Breadcrumb, { BreadcrumbItem } from '../ui/Breadcrumb';
import { t } from 'i18next';

import { setSettingsHeaderPreview } from './SettingsPane';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function ProfileSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Account",
      iconName: 'settings',
    });
  })

  onCleanup(() => {
    setSettingsHeaderPreview(reconcile({}));
  })

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t('settings.drawer.account')} href='../account' />
        <BreadcrumbItem title="Profile" />
      </Breadcrumb>

      <EditProfilePage />
    </Container>
  )
}



const bioBlockStyles = css`
  && {
    height: initial;
    min-height: initial;
    align-items: start;
    flex-direction: column;
    flex: 0;
    padding-top: 15px;
    align-items: stretch;
  }
  .inputContainer {
    margin-left: 35px;
    margin-top: 5px;
  }
  textarea {
    height: 100px;
  }
`;

function EditProfilePage() {
  const { account } = useStore();
  const [userDetails, setUserDetails] = createSignal<UserDetails | null>(null);
  const [error, setError] = createSignal<null | string>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  const defaultInput = () => ({
    bio: userDetails()?.profile?.bio || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);

  createEffect(on(account.user, (user) => {
    if (!user) return;
    getUserDetailsRequest(account.user()?.id).then(setUserDetails)
  }))

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateUser({
      bio: values.bio?.trim() || null
    })
      .then(() => {
        setUserDetails(() => ({ ...userDetails()!, profile: { bio: values.bio } }))
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))
  }

  return (
    <>
      <SettingsBlock icon='info' label='Bio' class={bioBlockStyles} description='Multiline and markup support'>
        <Text size={12} style={{ "margin-left": "38px", "margin-top": "5px" }}>({inputValues().bio.length} / 1000)</Text>
        <Input class='inputContainer' type='textarea' value={inputValues().bio} onText={(v) => setInputValue('bio', v)} />
      </SettingsBlock>
      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
      </Show>
    </>
  )
}