import { Show, createEffect} from 'solid-js';
import { styled } from 'solid-styled-components';

import useOldStore from '@/chat-api/store/useStore';
import Breadcrumb, { BreadcrumbItem } from '../ui/Breadcrumb';
import { t } from 'i18next';
import SettingsBlock from '../ui/settings-block/SettingsBlock';
import Button from '../ui/Button';
import { createGoogleAccountLink, unlinkAccountWithGoogle } from '@/chat-api/services/UserService';
import { useStore } from '@/store';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function NotificationsSettings() {
  const { header } = useOldStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Notifications",
      iconName: 'settings',
    });
  })


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t('settings.drawer.connections')} />
      </Breadcrumb>
      <Connections/>
    </Container>
  )
}


function Connections() {


  return (
    <>
    <GoogleLink/>
    </>
  )
}

function GoogleLink() {
  const store = useStore();
  const loggedInUser = () => store.account.getLoggedInUser()
  const isConnected = () => loggedInUser()?.connections.find(c => c.provider === 'GOOGLE')

  const linkGoogle = () => {
    createGoogleAccountLink().then(url => {
      window.open(url, "_blank");
    }).catch(err => {
      alert(err.message)
    })
  }
  const unlinkGoogle = async () => {
    await unlinkAccountWithGoogle().catch(err => {
      alert(err.message)
    })
  }
  
  return (
    <SettingsBlock iconSrc='/assets/Google.svg' label='Google' description='Linking your Google account will allow you to upload files in Nerimity. Files will be stored in your Google Drive.'>
      <Show when={!isConnected()}><Button label='Link' iconName='link' onClick={linkGoogle}  /></Show>
      <Show when={isConnected()}><Button label='Unlink' color='var(--alert-color)' iconName='link_off' onClick={unlinkGoogle}  /></Show>
    </SettingsBlock>
  )


}
