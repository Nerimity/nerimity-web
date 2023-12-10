import Icon from '@/components/ui/icon/Icon';
import { Link, useMatch } from '@solidjs/router';
import { For } from 'solid-js';
import exploreRoutes from '@/common/exploreRoutes';
import ItemContainer from '@/components/ui/Item';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn } from '../ui/Flexbox';
import { DrawerHeader } from '../DrawerHeader';
import { useTransContext } from '@mbarzda/solid-i18next';
import { t } from 'i18next';
import InVoiceActions from '../InVoiceActions';



const DrawerContainer = styled(FlexColumn)`
  height: 100%;
`;

const ExploreListContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
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
      <Footer/>
    </DrawerContainer>
  )
}

function ExploreList() {
  const [t] = useTransContext();
  return (
    <ExploreListContainer>
      <DrawerHeader text={t("explore.drawer.title")} />
      <For each={exploreRoutes}>
        {(setting) =>
          <Item path={setting.path || "#  "} icon={setting.icon} label={t(setting.name)} />
        }
      </For>
    </ExploreListContainer>
  )
}




function Item(props: { path: string, icon: string, label: string, onClick?: () => void }) {
  const href = () => {
    return "/app/explore/" + props.path;
  };
  const selected = useMatch(() => href() + "/*")

  return (
    <Link
      href={href()}
      style={{ "text-decoration": "none" }}
    >
      <ExploreItemContainer selected={selected()}>
        <Icon name={props.icon} size={18} />
        <Text class="label">{props.label}</Text>
      </ExploreItemContainer>
    </Link>
  )
}


const FooterContainer = styled(FlexColumn)`
  margin-bottom: 2px;
`;

function Footer() {


  return (
    <FooterContainer gap={2}>
      <SupportItem/>
      <InVoiceActions />
    </FooterContainer>
  );
}


function SupportItem() {

  return (
    <Link
      href="https://ko-fi.com/supertiger"
      target="_blank"
      rel="noopener noreferrer"
      style={{ "text-decoration": "none" }}
    >
      <ExploreItemContainer style={{ background: 'var(--alert-color)', height: 'initial', "padding": "10px" }}>
        <Icon style={{ "align-self": 'start', "margin-top": "3px" }} name="favorite" size={18} />
        <div>
          <Text style={{ "font-weight": 'bold' }}>{t('settings.drawer.supportMe')}</Text>
          <div>
            <Text size={12}>Support this project on Ko-fi to get a supporter badge!</Text>
          </div>
        </div>
        <Icon class={css`margin-left: auto;`} style={{ "align-self": 'start', "margin-top": "3px" }} color="rgba(255,255,255,0.6)" name="launch" size={16} />
      </ExploreItemContainer>
    </Link>
  )
}
