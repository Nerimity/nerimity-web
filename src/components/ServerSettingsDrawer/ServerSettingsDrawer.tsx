import styles from './styles.module.scss';
import ServerDrawerHeader from '../ServerDrawerHeader/ServerDrawerHeader';
import { Icon } from '../Icon/Icon';
import { classNames, conditionalClass } from '../../common/classNames';
import ServerSettings, { ServerSetting } from '../../common/ServerSettings';
import { Link, useNavigate, useParams } from 'solid-app-router';
import { createEffect, For, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';

export default function ServerSettingsDrawer() {
  return (
    <div>
      <ServerDrawerHeader />
      <SettingsList />
    </div>
  )
}

function SettingsList () {
  const params = useParams();
  const settings = Object.values(ServerSettings);

  return (
    <div>
      <For each={settings} >
        {(setting) => (
          <Item path={setting.path} icon={setting.icon} label={setting.name} selected={params.path === setting.path} />
        )}
      </For>
    </div>
  )
}


function Item (props: {path: string,icon: string, label: string, selected?: boolean, onClick?: () => void}) {
  const params = useParams();

  const href = () => "/app/servers/" + params.serverId + "/settings/" + props.path;

  return (
    <Link href={href()} class={classNames(styles.item, conditionalClass(props.selected, styles.selected))}>
      <Icon name={props.icon} size={18} />
      <div class={styles.label}>{props.label}</div>
    </Link>
  )
}