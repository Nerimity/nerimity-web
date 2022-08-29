import styles from './styles.module.scss'
import { getServeSetting, ServerSetting } from '@/common/ServerSettings';
import CustomSuspense from '@/components/custom-suspense';
import { useLocation, useParams } from '@solidjs/router';
import { createEffect, createSignal, on, onMount, Show } from 'solid-js';
import ServerSettingsHeader from './header';
import { Transition } from 'solid-transition-group';

import "./styles.css"
import useStore from '@/chat-api/store/useStore';
export default function ServerSettingsPane() {
  const params = useParams();

  const location = useLocation();

  const {servers} = useStore();

  const [setting, setSetting] = createSignal<ServerSetting | null>(null);

  createEffect(on(() => params.path! && params.serverId && params.id, () => {
    setSetting(null);
    setTimeout(() => {
      setSetting(getServeSetting(params.path!, location.pathname) || null);
    }, 0);
  }));

  const server = () => servers.get(params.serverId);
  
  return (
    <Show when={server()}>
      <div class={styles.pane}>
        <ServerSettingsHeader />
        <Transition name="slide" appear={true}>
          <Show when={setting()}>
            <CustomSuspense>
              {setting()?.element}
            </CustomSuspense>
          </Show>
        </Transition>
      </div>
    </Show>
  );

}