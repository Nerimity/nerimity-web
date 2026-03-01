import { createEffect, createSignal } from "solid-js";
import { css, styled } from "solid-styled-components";

import { FlexColumn } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import SettingsBlock, { SettingsGroup } from "../ui/settings-block/SettingsBlock";
import { RadioBox, RadioBoxItem } from "../ui/RadioBox";
import { updateUser } from "@/chat-api/services/UserService";
import Checkbox from "../ui/Checkbox";
import Block from "../ui/settings-block/Block";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const RadioBoxContainer = styled(Block)`
  padding-left: 50px;
`;

export default function PrivacySettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.privacy"),
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.privacy")} />
      </Breadcrumb>

      <LastOnlineOptions />
      <DMOptions />
      <ProfileOptions />
    </Container>
  );
}

function LastOnlineOptions() {
  const { account } = useStore();

  const friendRequestStatus = () => account.user()?.lastOnlineStatus;

  const radioboxItems = [
    { id: 0, label: t("settings.privacy.options.nobody") },
    { id: 1, label: t("settings.privacy.options.friendsOnly") },
    { id: 2, label: t("settings.privacy.options.friendsAndServers") },
  ];

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      lastOnlineStatus: id as number,
    });
  };

  return (
    <SettingsGroup>
      <SettingsBlock
        description={t("settings.privacy.lastOnline.description")}
        icon="schedule"
        label={t("settings.privacy.lastOnline.title")}
      />
      <RadioBoxContainer>
        <RadioBox
          onChange={onChange}
          items={radioboxItems}
          initialId={friendRequestStatus() || 0}
        />
      </RadioBoxContainer>
    </SettingsGroup>
  );
}

function DMOptions() {
  const { account } = useStore();

  const friendRequestStatus = () => account.user()?.friendRequestStatus;

  const radioboxItems = [
    { id: 0, label: t("settings.privacy.options.anybody") },
    { id: 1, label: t("settings.privacy.options.serversOnly") },
    { id: 2, label: t("settings.privacy.options.nobody") },
  ];

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      friendRequestStatus: id as number,
    });
  };

  return (
    <>
      <DirectMessageBlock />
      <SettingsGroup>
        <SettingsBlock
          description={t("settings.privacy.friendRequest.description")}
          icon="group_add"
          label={t("settings.privacy.friendRequest.title")}
        />
        <RadioBoxContainer>
          <RadioBox
            onChange={onChange}
            items={radioboxItems}
            initialId={friendRequestStatus() || 0}
          />
        </RadioBoxContainer>
      </SettingsGroup>
    </>
  );
}

const DirectMessageBlock = () => {
  const { account } = useStore();

  const currentDmStatus = () => account.user()?.dmStatus;

  const radioboxItems = [
    { id: 0, label: t("settings.privacy.options.anybody") },
    { id: 1, label: t("settings.privacy.options.friendsAndServers") },
    { id: 2, label: t("settings.privacy.options.friendsOnly") },
  ];

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      dmStatus: id as number,
    });
  };
  return (
    <SettingsGroup>
      <SettingsBlock
        description={t("settings.privacy.directMessage.description")}
        icon="chat_bubble"
        label={t("settings.privacy.directMessage.title")}
      />
      <RadioBoxContainer>
        <RadioBox
          onChange={onChange}
          items={radioboxItems}
          initialId={currentDmStatus() || 0}
        />
      </RadioBoxContainer>
    </SettingsGroup>
  );
};

const ProfileOptions = () => {
  const store = useStore();
  const user = () => store.account.user();

  const [hideFollowers, setHideFollowers] = createSignal(
    user()?.hideFollowers || false
  );
  const [hideFollowing, setHideFollowing] = createSignal(
    user()?.hideFollowing || false
  );

  createEffect(() => {
    setHideFollowers(user()?.hideFollowers || false);
    setHideFollowing(user()?.hideFollowing || false);
  });

  const onChange = (type: "followers" | "following") => {
    return (newVal: boolean) => {
      if (type === "followers") setHideFollowers(newVal);
      if (type === "following") setHideFollowing(newVal);

      updateUser({
        hideFollowers: hideFollowers(),
        hideFollowing: hideFollowing(),
      });
    };
  };

  return (
    <SettingsGroup>
      <SettingsBlock
        icon="person"
        label={t("settings.privacy.profileOptions.title")}
      />
      <SettingsBlock
        label={t("settings.privacy.profileOptions.hideFollowers")}
        description={t(
          "settings.privacy.profileOptions.hideFollowersDescription"
        )}
      >
        <Checkbox checked={hideFollowers()} onChange={onChange("followers")} />
      </SettingsBlock>
      <SettingsBlock
        label={t("settings.privacy.profileOptions.hideFollowing")}
        description={t(
          "settings.privacy.profileOptions.hideFollowingDescription"
        )}
      >
        <Checkbox checked={hideFollowing()} onChange={onChange("following")} />
      </SettingsBlock>
    </SettingsGroup>
  );
};
