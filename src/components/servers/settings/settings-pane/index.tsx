import styles from './styles.module.scss'
import serverSettings, { getServeSetting, ServerSetting } from '@/common/ServerSettings';
import CustomSuspense from '@/components/custom-suspense';
import { Route, Routes, useLocation, useParams, useRoutes } from '@nerimity/solid-router';
import { createEffect, createSignal, For, Match, on, onMount, Show, Switch } from 'solid-js';
import ServerSettingsHeader from './header';
import { Transition } from 'solid-transition-group';

import "./styles.css"
import useStore from '@/chat-api/store/useStore';
export default function ServerSettingsPane() {
  const params = useParams();
  const {servers} = useStore();

  const server = () => servers.get(params.serverId);

  return (
    <Show when={server()}>
      <div class={styles.pane}>
        <ServerSettingsHeader />
        <For each={serverSettings}>
          {setting => (
            <Routes>
              {setting.path && <Route path={`/${setting.path}`} component={setting.element} />}
            </Routes>
          )}
        </For>
      </div>
    </Show>
  );
}