import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { css, styled } from "solid-styled-components";

import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";

import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import { electronWindowAPI } from "@/common/Electron";
import { addBit, Bitwise, USER_BADGES } from "@/chat-api/Bitwise";
import { RawUser } from "@/chat-api/RawData";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { SelfUser } from "@/chat-api/events/connectionEventTypes";
import Avatar from "../ui/Avatar";
import { Notice } from "../ui/Notice/Notice";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  flex-shrink: 0;
`;

export default function BadgeSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.badges"),
      iconName: "settings",
    });
  });

  const availableBadges = [
    USER_BADGES.DEER_EARS_HORNS,
    USER_BADGES.GOAT_HORNS,
    USER_BADGES.GOAT_EARS_WHITE,
    USER_BADGES.WOLF_EARS,
    USER_BADGES.DOG_SHIBA,
    USER_BADGES.DOG_EARS_BROWN,
    USER_BADGES.BUNNY_EARS_MAID,
    USER_BADGES.BUNNY_EARS_BLACK,
    USER_BADGES.CAT_EARS_BLUE,
    USER_BADGES.CAT_EARS_WHITE,
    USER_BADGES.FOX_EARS_GOLD,
    USER_BADGES.FOX_EARS_BROWN,
  ];

  const palestineDescription = () => {
    const account = t("settings.drawer.account");
    const profile = t("settings.drawer.profile");
    return t("settings.badges.palestineDescription", {
      account,
      profile,
    });
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.badges")} />
      </Breadcrumb>

      <Notice
        description={t("settings.badges.notice")}
        type="error"
        title={t("settings.badges.noticeTitle")}
        icon="favorite"
      />
      <SupportMethodBlock />
      <BadgesPreview badges={[USER_BADGES.SUPPORTER]} price={10} />
      <BadgesPreview badges={availableBadges} price={3} />
      <BadgesPreview
        badges={[
          {
            ...USER_BADGES.PALESTINE,
            description: palestineDescription,
          },
        ]}
        price={0}
      />
    </Container>
  );
}

const BadgesPreview = (props: { badges: Bitwise[]; price: number }) => {
  const store = useStore();
  const user = () => store.account.user();

  return (
    <Show when={user()}>
      <div>
        <SettingsBlock
          header
          label={t("settings.badges.price", { price: `$${props.price}` })}
          icon="favorite"
        />
        <For each={props.badges}>
          {(badge, i) => (
            <BadgeItem
              user={user()!}
              badge={badge}
              index={i()}
              length={props.badges.length}
            />
          )}
        </For>
      </div>
    </Show>
  );
};

const BadgeItem = (props: {
  user: SelfUser;
  badge: Bitwise;
  index: number;
  length: number;
}) => {
  const [hovered, setHovered] = createSignal(false);
  return (
    <SettingsBlock
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      label={props.badge.name}
      borderBottomRadius={props.index === props.length - 1}
      borderTopRadius={false}
      description={props.badge.description}
      icon={
        <Avatar
          user={{ ...props.user, badges: props.badge.bit }}
          size={42}
          animate={hovered()}
        />
      }
    />
  );
};

const SupportMethodBlock = () => {
  return (
    <div>
      <SettingsBlock
        label={t("settings.badges.supportMethods")}
        icon="info"
        header
      />
      <SettingsBlock
        label="Ko-Fi"
        borderBottomRadius={false}
        borderTopRadius={false}
        iconSrc="/assets/kofi.png"
        href="https://ko-fi.com/supertiger"
        hrefBlank
      />
      <SettingsBlock
        borderTopRadius={false}
        class={css`
          img {
            border-radius: 50%;
          }
        `}
        label="Boosty"
        iconSrc="/assets/boosty.jpg"
        href="https://boosty.to/supertigerdev/donate"
        hrefBlank
      />
    </div>
  );
};
