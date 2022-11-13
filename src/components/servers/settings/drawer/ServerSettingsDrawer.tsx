import styles from './styles.module.scss';
import ServerDrawerHeader from '@/components/servers/drawer/header/ServerDrawerHeader';
import Icon from '@/components/ui/icon/Icon';
import { classNames, conditionalClass } from '@/common/classNames';
import { Link, useMatch, useParams } from '@nerimity/solid-router';
import { For, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import RouterEndpoints from '@/common/RouterEndpoints';
import serverSettings from '@/common/ServerSettings';
import ItemContainer from '@/components/ui/Item';
import { styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';


const SettingItemContainer = styled(ItemContainer)<{nested?: boolean}>`
  height: 32px;
  gap: 5px;
  padding-left: ${props => props.nested ? '25px' : '10px'};
  margin-left: 3px;
  margin-right: 3px;
`;


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

  return (
    <div class={styles.list}>
      <For each={serverSettings}>
        {(setting) => {
          if (setting.hideDrawer) return null;
          const selected = () => params.path === setting.path;
          const isChannels = () => setting.path === "channels";
          return (
            <>
              <Item path={setting.path || "#  "} icon={setting.icon} label={setting.name} selected={selected()} />
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

  const href = () => {
    if (props.nested) return props.path;
    return "/app/servers/" + params.serverId + "/settings/" + props.path;
  };

  const selected = useMatch(href)

  return (
    <Link 
      href={href()}
      style={{"text-decoration": "none"}}
      >
        <SettingItemContainer nested={props.nested} selected={selected()}>
          <Icon name={props.icon} size={18} />
          <Text class={styles.label}>{props.label}</Text>
        </SettingItemContainer>
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
        const path = RouterEndpoints.SERVER_SETTINGS_CHANNEL(params.serverId, channel!.id);
        const selected = () =>params.id === channel!.id;
        return <Item nested={true} icon='storage' label={channel!.name} path={path} selected={selected()} />
      }}
    </For>
  )
}