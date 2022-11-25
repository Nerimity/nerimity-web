import Icon from '@/components/ui/icon/Icon';
import { Link, useMatch, useParams } from '@nerimity/solid-router';
import { For, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import RouterEndpoints from '@/common/RouterEndpoints';
import settings from '@/common/Settings';
import ItemContainer from '@/components/ui/Item';
import { styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';

const SettingsListContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 5px;
`;

const SettingItemContainer = styled(ItemContainer)<{nested?: boolean}>`
  height: 32px;
  gap: 5px;
  padding-left: ${props => props.nested ? '25px' : '10px'};
  margin-left: 3px;
  margin-right: 3px;

  .label {
    opacity: ${props => props.selected ? 1 : 0.6};
    transition: 0.2s;
  }

  &:hover .label {
    opacity: 1;
  }
`;


export default function SettingsDrawer() {
  return (
    <div>
      <SettingsList />
    </div>
  )
}

function SettingsList () {
  return (
    <SettingsListContainer>
      <For each={settings}>
        {(setting) => 
          <Item path={setting.path || "#  "} icon={setting.icon} label={setting.name} />
        }
      </For>
    </SettingsListContainer>
  )
}


function Item (props: {path: string, icon: string, label: string, onClick?: () => void}) {

  const href = () => {
    return "/app/settings/" + props.path;
  };

  const selected = useMatch(href)

  return (
    <Link 
      href={href()}
      style={{"text-decoration": "none"}}
      >
        <SettingItemContainer selected={selected()}>
          <Icon name={props.icon} size={18} />
          <Text class="label">{props.label}</Text>
        </SettingItemContainer>
    </Link>
  )
}