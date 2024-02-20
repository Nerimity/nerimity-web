import { createEffect } from "solid-js";
import { css, styled } from "solid-styled-components";

import { FlexColumn } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { RadioBox, RadioBoxItem } from "../ui/RadioBox";
import { updateUser } from "@/chat-api/services/UserService";

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
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.privacy")} />
      </Breadcrumb>
      <DMOptions />
    </Container>
  );
}


function DMOptions() {
  const {account} = useStore();

  const friendRequestStatus = () => account.user()?.friendRequestStatus;

  const radioboxItems = [
    { id: 0, label: "Anyone" },
    { id: 1, label: "Servers only" },
    { id: 2, label: "Nobody" }
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

      <SettingsBlock class={css`margin-top: 10px;`} description="Set who can send you friend requests." header icon='group_add' label='Friend Request'  />
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
    { id: 0, label: "Anyone" },
    { id: 1, label: "Friends & Servers only" },
    { id: 2, label: "Friends only" }
  ];

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      dmStatus: id as number
    });
  };
  return (
    <>
      <SettingsBlock class={css`margin-top: 10px;`} description="Set who can send you direct messages." header icon='chat_bubble' label='Direct Message'  />
      <RadioBoxContainer>
        <RadioBox onChange={onChange} items={radioboxItems} initialId={currentDmStatus() || 0} />
      </RadioBoxContainer>

    </>
  );
};