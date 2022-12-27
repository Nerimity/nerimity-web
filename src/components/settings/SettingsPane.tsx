import Settings from '@/common/Settings';
import { Route, Routes } from '@nerimity/solid-router';
import { For, Show } from 'solid-js';
import SettingsHeader from './SettingsHeader';
import useStore from '@/chat-api/store/useStore';
import { styled } from 'solid-styled-components';
import { useTransContext } from '@mbarzda/solid-i18next';
import Text from '../ui/Text';

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

  return (
    <Show when={user()}>
      <SettingsPaneContainer>
        <SettingsHeader />
        <For each={Settings}>
          {setting => (
            <Routes>
              {setting.path && <Route path={`/${setting.path}`} component={() => (
                <>
                  <Text style={{"margin-left": "10px"}}  size={24}>{t(setting.name)}</Text>
                  <setting.element/>
                </>
              )} />}
            </Routes>
          )}
        </For>
      </SettingsPaneContainer>
    </Show>
  );
}