import styles from './styles.module.scss'
import ServerSettings, { ServerSetting } from '../../common/ServerSettings';
import CustomSuspense from '../CustomSuspense';
import { useParams } from 'solid-app-router';
import { createEffect, createSignal, on, Show } from 'solid-js';
import ServerSettingsHeader from '../ServerSettingsHeader';
import { Transition } from 'solid-transition-group';

import "./styles.css"
import useStore from '../../chat-api/store/useStore';
export default function ServerSettingsPane() {
  const params = useParams();

  const {servers} = useStore();

  const [setting, setSetting] = createSignal<ServerSetting | null>(null);

  createEffect(on(() => params.path! && params.serverId, () => {
    setSetting(null);
    setTimeout(() => {
      setSetting(ServerSettings[params.path!]);
    }, 200);
  }));

  const server = () => servers.get(params.serverId);
  
  return (
    <Transition name="slide" appear={true}>
      <Show when={setting() && server()}>
        <div class={styles.pane}>
          <ServerSettingsHeader />
          <CustomSuspense>
            {setting()?.element}
          </CustomSuspense>
        </div>
      </Show>
    </Transition>
  );

}