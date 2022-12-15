import Icon from '@/components/ui/icon/Icon';
import { Link, useMatch } from '@nerimity/solid-router';
import { For } from 'solid-js';
import exploreRoutes from '@/common/exploreRoutes';
import ItemContainer from '@/components/ui/Item';
import {  styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn } from '../ui/Flexbox';



const DrawerContainer = styled(FlexColumn)`
  height: 100%;
`;

const ExploreListContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 5px;
  flex: 1;
  overflow: auto;
`;

const ExploreItemContainer = styled(ItemContainer)`
  height: 32px;
  gap: 5px;
  padding-left: 10px;
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
    <DrawerContainer>
      <ExploreList />
    </DrawerContainer>
  )
}

function ExploreList () {
  return (
    <ExploreListContainer>
      <For each={exploreRoutes}>
        {(setting) => 
          <Item path={setting.path || "#  "} icon={setting.icon} label={setting.name} />
        }
      </For>
    </ExploreListContainer>
  )
}




function Item (props: {path: string, icon: string, label: string, onClick?: () => void}) {
  const href = () => {
    return "/app/explore/" + props.path;
  };
  const selected = useMatch(href)

  return (
    <Link 
      href={href()}
      style={{"text-decoration": "none"}}
      >
        <ExploreItemContainer selected={selected()}>
          <Icon name={props.icon} size={18} />
          <Text class="label">{props.label}</Text>
        </ExploreItemContainer>
    </Link>
  )
}
