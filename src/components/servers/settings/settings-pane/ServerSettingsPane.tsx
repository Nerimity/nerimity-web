import serverSettings from '@/common/ServerSettings';
import { Route, Routes, useParams } from '@nerimity/solid-router';
import {For, Show } from 'solid-js';
import ServerSettingsHeader from './ServerSettingsHeader';
import useStore from '@/chat-api/store/useStore';
import { styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { useTransContext } from '@mbarzda/solid-i18next';


const SettingsPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

export default function ServerSettingsPane() {
  const [t] = useTransContext();
  const params = useParams();
  const {servers} = useStore();

  const server = () => servers.get(params.serverId);

  return (
    <Show when={server()}>
      <SettingsPaneContainer>
        <ServerSettingsHeader />
        <For each={serverSettings}>
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