import styles from './styles.module.scss'
import ServerSettings, { ServerSetting } from '../../common/ServerSettings';
import CustomSuspense from '../CustomSuspense';
import { useParams } from 'solid-app-router';
import { createEffect, createSignal, on, Show } from 'solid-js';
import ServerSettingsHeader from '../ServerSettingsHeader';
import { Transition } from 'solid-transition-group';

import "./styles.css"
export default function ServerSettingsPane() {
  const params = useParams();

  const [setting, setSetting] = createSignal<ServerSetting | null>(null);

  createEffect(on(() => params.path! && params.serverId, () => {
    setSetting(null);
    setTimeout(() => {
      setSetting(ServerSettings[params.path!]);
    }, 200);
  }));

  
  return (
    <Transition name="slide" appear={true}>
      <Show when={setting()}>
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