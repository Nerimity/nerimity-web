import Icon from "@/components/ui/icon/Icon";
import { A, useMatch } from "solid-navigator";
import { For } from "solid-js";
import exploreRoutes from "@/common/exploreRoutes";
import ItemContainer from "@/components/ui/LegacyItem";
import { css, styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { DrawerHeader } from "../drawer-header/DrawerHeader";
import { useTransContext } from "@nerimity/solid-i18lite";
import { t } from "@nerimity/i18lite";
import InVoiceActions from "../InVoiceActions";
import { SupportBlock } from "../SupportBlock";
import { useWindowProperties } from "@/common/useWindowProperties";

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
    opacity: ${(props) => (props.selected ? 1 : 0.6)};
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
      <Footer />
    </DrawerContainer>
  );
}

function ExploreList() {
  const [t] = useTransContext();
  return (
    <ExploreListContainer>
      <DrawerHeader text={t("explore.drawer.title")} />
      <For each={exploreRoutes}>
        {(setting) => (
          <Item
            path={setting.path || "#  "}
            icon={setting.icon}
            label={setting.name()}
          />
        )}
      </For>
    </ExploreListContainer>
  );
}

function Item(props: {
  path: string;
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  const href = () => {
    return "/app/explore/" + props.path;
  };
  const selected = useMatch(() => href() + "/*");

  return (
    <A href={href()} style={{ "text-decoration": "none" }}>
      <ExploreItemContainer selected={selected()}>
        <Icon name={props.icon} size={18} />
        <Text class="label" size={14}>
          {props.label}
        </Text>
      </ExploreItemContainer>
    </A>
  );
}

const FooterContainer = styled(FlexColumn)`
  margin-bottom: 2px;
  &[data-mobile-width="true"] {
    padding-bottom: 74px;
  }
`;

function Footer() {
  const { isMobileWidth } = useWindowProperties();
  return (
    <FooterContainer gap={2} data-mobile-width={isMobileWidth()}>
      <SupportBlock />
      <InVoiceActions style={isMobileWidth() ? { bottom: "76px" } : {}} />
    </FooterContainer>
  );
}
