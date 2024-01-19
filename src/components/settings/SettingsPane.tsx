import Settings from '@/common/Settings';
import { Route, Routes } from 'solid-navigator';
import { createSignal, For, Show } from 'solid-js';
import SettingsHeader from './SettingsHeader';
import useStore from '@/chat-api/store/useStore';
import { styled } from 'solid-styled-components';
import { useTransContext } from '@mbarzda/solid-i18next';
import Text from '../ui/Text';
import { createStore } from 'solid-js/store';
import settings from '@/common/Settings';

const SettingsPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

export default function SettingsPane() {
  const [t] = useTransContext();
  const { account} = useStore();
  const user = () => account.user();

  const [updateHeader, setUpdateHeader] = createStore<{username?: string, tag?: string, banner?: string, avatar?: any}>({});

  return (
    <Show when={user()}>
      <SettingsPaneContainer>
        <SettingsHeader headerPreviewDetails={updateHeader} />
        <For each={Settings}>
          {setting => (
            <Routes>
              {(setting.path || setting.routePath) && <Route path={`/${setting.routePath || setting.path}`} component={() => (
                <>
                  <setting.element updateHeader={setUpdateHeader}/>
                </>
              )} />}
            </Routes>
          )}
        </For>
      </SettingsPaneContainer>
    </Show>
  );
}