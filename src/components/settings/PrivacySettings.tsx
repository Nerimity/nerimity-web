import { createEffect, createSignal } from "solid-js";
import { css, styled } from "solid-styled-components";

import { FlexColumn } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { RadioBox, RadioBoxItem } from "../ui/RadioBox";
import { updateUser } from "@/chat-api/services/UserService";
import Checkbox from "../ui/Checkbox";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


const RadioBoxContainer = styled("div")`
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.05);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 10px;
  padding-left: 50px;
`;


export default function PrivacySettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Privacy",
      iconName: "settings"
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.privacy")} />
      </Breadcrumb>

      <LastOnlineOptions/>
      <DMOptions />
      <ProfileOptions/>

    </Container>
  );
}


function LastOnlineOptions() {
  const {account} = useStore();

  const friendRequestStatus = () => account.user()?.lastOnlineStatus;

  const radioboxItems = [
    { id: 0, label: t("settings.privacy.lastOnline.hidden") },
    { id: 1, label: t("settings.privacy.lastOnline.friendsOnly") },
    { id: 2, label: t("settings.privacy.lastOnline.friendsAndServers") }
  ];

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      lastOnlineStatus: id as number
    });
  };

  return (
    <FlexColumn>


      <SettingsBlock class={css`margin-top: 10px;`} description={t("settings.privacy.lastOnline.description")} header icon='access_time' label={t("settings.privacy.lastOnline.title")}  />
      <RadioBoxContainer>
        <RadioBox onChange={onChange} items={radioboxItems} initialId={friendRequestStatus() || 0} />
      </RadioBoxContainer>

    </FlexColumn>
  );
}


function DMOptions() {
  const {account} = useStore();

  const friendRequestStatus = () => account.user()?.friendRequestStatus;

  const radioboxItems = [
    { id: 0, label: t("settings.privacy.friendRequest.anyone") },
    { id: 1, label: t("settings.privacy.friendRequest.serversOnly") },
    { id: 2, label: t("settings.privacy.friendRequest.nobody") }
  ];

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      friendRequestStatus: id as number
    });
  };

  return (
    <FlexColumn>

      <DirectMessageBlock/>

      <SettingsBlock class={css`margin-top: 10px;`} description={t("settings.privacy.friendRequest.description")} header icon='group_add' label={t("settings.privacy.friendRequest.title")}  />
      <RadioBoxContainer>
        <RadioBox onChange={onChange} items={radioboxItems} initialId={friendRequestStatus() || 0} />
      </RadioBoxContainer>

    </FlexColumn>
  );
}

const DirectMessageBlock = () => {
  const {account} = useStore();

  const currentDmStatus = () => account.user()?.dmStatus;

  const radioboxItems = [
    { id: 0, label: t("settings.privacy.directMessage.anyone") },
    { id: 1, label: t("settings.privacy.directMessage.friendsAndServersOnly") },
    { id: 2, label: t("settings.privacy.directMessage.friendsOnly") }
  ];

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      dmStatus: id as number
    });
  };
  return (
    <>
      <SettingsBlock class={css`margin-top: 10px;`} description={t("settings.privacy.directMessage.description")} header icon='chat_bubble' label={t("settings.privacy.directMessage.title")}  />
      <RadioBoxContainer>
        <RadioBox onChange={onChange} items={radioboxItems} initialId={currentDmStatus() || 0} />
      </RadioBoxContainer>

    </>
  );
};


const ProfileOptions = () => {
  
  const store = useStore();
  const user = () => store.account.user();

  const [hideFollowers, setHideFollowers] = createSignal(user()?.hideFollowers || false);
  const [hideFollowing, setHideFollowing] = createSignal(user()?.hideFollowing || false);

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
        hideFollowing: hideFollowing()
      })
    }
  }

  return (
    <FlexColumn>
      <SettingsBlock class={css`margin-top: 10px;`} header icon='person' label={t("settings.privacy.profileOptions.title")}  />
      <SettingsBlock label={t("settings.privacy.profileOptions.hideFollowers")} description={t("settings.privacy.profileOptions.hideFollowersDescription")} borderBottomRadius={false} borderTopRadius={false}>
        <Checkbox checked={hideFollowers()} onChange={onChange("followers")} />
      </SettingsBlock>
      <SettingsBlock label={t("settings.privacy.profileOptions.hideFollowing")} description={t("settings.privacy.profileOptions.hideFollowingDescription")} borderTopRadius={false}>
        <Checkbox checked={hideFollowing()} onChange={onChange("following")} />
      </SettingsBlock>
    </FlexColumn>
  )
}