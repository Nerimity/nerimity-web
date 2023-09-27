import { createEffect} from 'solid-js';
import { styled } from 'solid-styled-components';

import useStore from '@/chat-api/store/useStore';
import Breadcrumb, { BreadcrumbItem } from '../ui/Breadcrumb';
import { t } from 'i18next';
import SettingsBlock from '../ui/settings-block/SettingsBlock';
import Button from '../ui/Button';
import { createGoogleAccountLink } from '@/chat-api/services/UserService';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function NotificationsSettings() {
  const { header } = useStore();

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

  const linkGoogle = () => {
    createGoogleAccountLink().then(url => {
      window.open(url, "_blank");
    }).catch(err => {
      alert(err.message)
    })
  }

  return (
    <SettingsBlock label='Google' description='Linking your Google account will allow you to upload files in Nerimity. Files will be stores in your Google Drive.'>
      <Button label='Link' iconName='link' onClick={linkGoogle}  />
    </SettingsBlock>
  )
}