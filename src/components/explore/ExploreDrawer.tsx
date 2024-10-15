import Icon from "@/components/ui/icon/Icon";
import { A, useMatch } from "solid-navigator";
import { For } from "solid-js";
import exploreRoutes from "@/common/exploreRoutes";
import ItemContainer from "@/components/ui/Item";
import { css, styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { DrawerHeader } from "../drawer-header/DrawerHeader";
import { useTransContext } from "@mbarzda/solid-i18next";
import { t } from "i18next";
import InVoiceActions from "../InVoiceActions";

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
            label={t(setting.name)}
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
`;

function Footer() {
  return (
    <FooterContainer gap={2}>
      <SupportItem />
      <InVoiceActions />
    </FooterContainer>
  );
}

function SupportItem() {
  return (
    <A
      href="https://boosty.to/supertigerdev/donate"
      target="_blank"
      rel="noopener noreferrer"
      style={{ "text-decoration": "none" }}
    >
      <ExploreItemContainer
        style={{
          background: "var(--alert-color)",
          height: "initial",
          padding: "6px",
          "align-items": "start",
          "flex-direction": "column",
        }}
      >
        <FlexRow gap={4}>
          <Icon
            style={{ "align-self": "start", "margin-top": "3px" }}
            name="favorite"
            size={18}
          />
          <div>
            <Text style={{ "font-weight": "bold" }}>
              {t("settings.drawer.supportMe")}
            </Text>
            <div>
              <Text size={12}>Donate to get a supporter badge!</Text>
            </div>
          </div>
        </FlexRow>
        <FlexRow style={{ "align-self": "center" }} gap={6}>
          <a target="_blank" href="https://ko-fi.com/supertiger">
            <img
              style={{ "border-radius": "50%" }}
              src="/assets/kofi.png"
              width={28}
              height={28}
            />
          </a>
          <a target="_blank" href="https://boosty.to/supertigerdev/donate">
            <img
              style={{ "border-radius": "50%" }}
              src="/assets/boosty.jpg"
              width={28}
              height={28}
            />
          </a>
        </FlexRow>
      </ExploreItemContainer>
    </A>
  );
}
