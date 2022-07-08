import styles from './styles.module.scss'
import ServerSettings from '../../common/ServerSettings';
import CustomSuspense from '../CustomSuspense';
import { useParams } from 'solid-app-router';
import { Show } from 'solid-js';
import ServerSettingsHeader from '../ServerSettingsHeader';

export default function ServerSettingsPane() {
  const params = useParams();

  
  const setting = () => ServerSettings[params.path!];

  return (
    <Show when={setting}>
      <div class={styles.pane}>
        <ServerSettingsHeader />
        <CustomSuspense>
          {setting()?.element}
        </CustomSuspense>
      </div>
    </Show>
  );

}