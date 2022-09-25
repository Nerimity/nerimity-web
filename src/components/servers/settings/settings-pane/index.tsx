import styles from './styles.module.scss'
import serverSettings, { getServeSetting, ServerSetting } from '@/common/ServerSettings';
import CustomSuspense from '@/components/custom-suspense';
import { useLocation, useParams } from '@solidjs/router';
import { createEffect, createSignal, For, Match, on, onMount, Show, Switch } from 'solid-js';
import ServerSettingsHeader from './header';
import { Transition } from 'solid-transition-group';

import "./styles.css"
import useStore from '@/chat-api/store/useStore';
export default function ServerSettingsPane() {
  const params = useParams();

  const location = useLocation();

  const {servers} = useStore();

  const [currentSetting, setCurrentSetting] = createSignal<{setting: ServerSetting, locPath: string} | null>(null);

  createEffect(on(() => params.path! && params.serverId && params.id, () => {
    const setting = getServeSetting(params.path!, location.pathname);
    if (!setting) return setCurrentSetting(null);
    setCurrentSetting({setting, locPath: location.pathname})
  }));

  const server = () => servers.get(params.serverId);
  
  return (
    <Show when={server()}>
      <div class={styles.pane}>
        <ServerSettingsHeader />
        {/* <Transition name="slide" mode="inout" appear={true}> */}
          <Switch>

            <For each={serverSettings}>
              {setting => (
                <Match when={currentSetting()?.setting === setting && currentSetting()?.locPath === location.pathname}>
                  <div>
                    <CustomSuspense>
                      {setting.element}
                    </CustomSuspense>
                  </div>
                </Match>
              )}
            </For>
          </Switch>
        {/* </Transition> */}
      </div>
    </Show>
  );

}