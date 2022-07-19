import styles from './styles.module.scss';
import ServerDrawerHeader from '../ServerDrawerHeader/ServerDrawerHeader';
import { Icon } from '../Icon/Icon';
import { classNames, conditionalClass } from '../../common/classNames';
import ServerSettings, { ServerSetting } from '../../common/ServerSettings';
import { Link, useNavigate, useParams } from 'solid-app-router';
import { createEffect, For, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import useStore from '../../chat-api/store/useStore';
import RouterEndpoints from '../../common/RouterEndpoints';

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
      <For each={settings}>
        {(setting) => {
          const selected = () => params.path === setting.path;
          const isChannels = () => setting.path === ServerSettings.channels.path;
          return (
            <>
              <Item path={setting.path} icon={setting.icon} label={setting.name} selected={selected()} />
              <Show when={isChannels()}><ServerChannelsList/></Show>
            </>
          )
        }}
      </For>
    </div>
  )
}


function Item (props: {path: string,icon: string, label: string, selected?: boolean, nested?: boolean, onClick?: () => void}) {
  const params = useParams();

  const href = () => "/app/servers/" + params.serverId + "/settings/" + props.path;

  return (
    <Link href={href()} class={classNames(styles.item, conditionalClass(props.selected, styles.selected), conditionalClass(props.nested, styles.nested))}>
      <Icon name={props.icon} size={18} />
      <div class={styles.label}>{props.label}</div>
    </Link>
  )
}

function ServerChannelsList () {
  const params = useParams();
  const {channels} = useStore();
  const serverChannels = () =>channels.getChannelsByServerId(params.serverId);

  return (
    <For each={serverChannels()}>
      {(channel) => {
        const path = `${ServerSettings.channels.path}/${channel._id}`
        const selected = () =>params.channelId === channel._id;
        return <Item nested={true} icon='storage' label={channel.name} path={path} selected={selected()} />
      }}
    </For>
  )
}