import Icon from "@/components/ui/icon/Icon";
import { A, useMatch } from "solid-navigator";
import { For, JSXElement, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import ItemContainer from "@/components/ui/LegacyItem";
import { styled } from "solid-styled-components";
import { FlexColumn } from "../ui/Flexbox";
import { DrawerHeader } from "../drawer-header/DrawerHeader";
import { Rerun } from "@solid-primitives/keyed";
import { getCurrentLanguage } from "@/locales/languages";

const DrawerContainer = styled(FlexColumn)`
  height: 100%;
  padding-left: 2px;
  padding-right: 4px;
`;

const ListContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const SettingItemContainer = styled(ItemContainer)<{ nested?: boolean }>`
  height: 32px;
  gap: 5px;
  padding-left: ${(props) => (props.nested ? "25px" : "10px")};
  margin-left: 3px;
  margin-right: 3px;
  :first {
    background-color: red;
  }

  .label {
    opacity: ${(props) => (props.selected ? 1 : 0.6)};
    font-size: 14px;
    transition: 0.2s;
    color: var(--text-color);
  }

  &:hover .label {
    opacity: 1;
  }
`;

export default function ModerationDrawer() {
  return (
    <Rerun on={getCurrentLanguage}>
      <DrawerHeader text="Moderation Pane" />
      <DrawerContainer>
        <List />
      </DrawerContainer>
    </Rerun>
  );
}

const items = [
  {
    name: () => "Legacy",
    path: "",
    icon: "science",
  },
  {
    name: () => "Users",
    path: "users",
    icon: "account_circle",
  },
  {
    name: () => "Tickets",
    path: "tickets",
    icon: "sell",
  },
];

function List() {
  const { tickets } = useStore();
  return (
    <ListContainer>
      <For each={items}>
        {(item) => (
          <Item path={item.path || ""} icon={item.icon} label={item.name()}>
            <Show
              when={
                item.path === "tickets" &&
                tickets.hasModerationTicketNotification()
              }
            >
              <NotificationCircle />
            </Show>
          </Item>
        )}
      </For>
    </ListContainer>
  );
}

function NotificationCircle() {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        background: "var(--alert-color)",
        "border-radius": "50%",
        color: "white",
        width: "20px",
        height: "20px",
        "font-size": "14px",
        "margin-left": "auto",
        "margin-right": "8px",
      }}
    >
      !
    </div>
  );
}

function Item(props: {
  path: string;
  icon: string;
  label: string;
  onClick?: () => void;
  children?: JSXElement;
}) {
  const href = () => {
    return "/app/moderation/" + props.path;
  };
  const selected = useMatch(() => href());

  return (
    <A href={href()} style={{ "text-decoration": "none" }}>
      <SettingItemContainer selected={selected()}>
        <Icon name={props.icon} size={18} />
        <div class="label">{props.label}</div>
        {props.children}
      </SettingItemContainer>
    </A>
  );
}
