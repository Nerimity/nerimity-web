import Settings from '@/common/Settings';
import { Route, Routes } from '@nerimity/solid-router';
import { For, Show } from 'solid-js';
import SettingsHeader from './SettingsHeader';
import useStore from '@/chat-api/store/useStore';
import { styled } from 'solid-styled-components';

const SettingsPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;
`;

export default function SettingsPane() {
  const { account} = useStore();
  const user = () => account.user();

  return (
    <Show when={user()}>
      <SettingsPaneContainer>
        <SettingsHeader />
        <For each={Settings}>
          {setting => (
            <Routes>
              {setting.path && <Route path={`/${setting.path}`} component={setting.element} />}
            </Routes>
          )}
        </For>
      </SettingsPaneContainer>
    </Show>
  );
}