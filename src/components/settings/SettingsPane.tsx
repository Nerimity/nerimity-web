import { Outlet } from 'solid-navigator';
import { Show } from 'solid-js';
import SettingsHeader from './SettingsHeader';
import useStore from '@/chat-api/store/useStore';
import { styled } from 'solid-styled-components';
import { useTransContext } from '@mbarzda/solid-i18next';
import { createStore } from 'solid-js/store';

const SettingsPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

interface SettingsHeaderPreview {
  username?: string;
  tag?: string; 
  banner?: string;
  avatar?: any;
  avatarPoints?: number[];
}

export const [settingsHeaderPreview, setSettingsHeaderPreview] = createStore<SettingsHeaderPreview>({});

export default function SettingsPane() {
  const [t] = useTransContext();
  const { account} = useStore();
  const user = () => account.user();


  return (
    <Show when={user()}>
      <SettingsPaneContainer>
        <SettingsHeader />
        <Outlet name='settingsPane' />
      </SettingsPaneContainer>
    </Show>
  );
}