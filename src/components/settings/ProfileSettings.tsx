import { createEffect, createSignal, JSXElement, on, onCleanup, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/Button";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import { getUserDetailsRequest, toggleBadge, updateUser, UserDetails } from "@/chat-api/services/UserService";
import { reconcile } from "solid-js/store";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";

import { setSettingsHeaderPreview } from "./SettingsPane";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { ProfileFlyout } from "../floating-profile/FloatingProfile";
import { ColorPicker } from "../ui/color-picker/ColorPicker";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { AdvancedMarkupOptions } from "../advanced-markup-options/AdvancedMarkupOptions";
import { formatMessage } from "../message-pane/MessagePane";
import { RawUser } from "@/chat-api/RawData";
import Checkbox from "../ui/Checkbox";
import { addBit, hasBit, USER_BADGES } from "@/chat-api/Bitwise";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function ProfileSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Account",
      iconName: "settings"
    });
  });

  onCleanup(() => {
    setSettingsHeaderPreview(reconcile({}));
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.account")} href='../' />
        <BreadcrumbItem title="Profile" />
      </Breadcrumb>
      <PalestineBorder/>
      <EditProfilePage />
    </Container>
  );
}

const PalestineBorder = () => {

  const store = useStore();
  const user = () => store.account.user();
  const hasBorder = () => hasBit(user()?.badges || 0, USER_BADGES.PALESTINE.bit);

  const onToggle = () => {
    toggleBadge(USER_BADGES.PALESTINE.bit).then((result) => {
      store.account.setUser({badges: result.badges});
    })
  }

  return (
    <SettingsBlock icon="favorite" label="Add Palestine border to your avatar." onClick={onToggle}>
      <Checkbox checked={hasBorder()} />
    </SettingsBlock>
  )
}



const bioBlockStyles = css`
  && {
    height: initial;
    min-height: initial;
    align-items: start;
    flex-direction: column;
    flex: 0;
    padding-top: 15px;
    align-items: stretch;
  }
  .inputContainer {
    margin-left: 35px;
  }
  .advancedMarkupOptions {
    margin-left: 35px;
    margin-top: 5px;

  }
  textarea {
    height: 100px;
  }
`;

export function EditProfilePage(props: {bot?: RawUser | null, botToken?: string | null}) {
  const { account } = useStore();
  const [userDetails, setUserDetails] = createSignal<UserDetails | null>(null);
  const [error, setError] = createSignal<null | string>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  const defaultInput = () => ({
    bio: userDetails()?.profile?.bio || "",
    bgColorOne: userDetails()?.profile?.bgColorOne,
    bgColorTwo: userDetails()?.profile?.bgColorTwo,
    primaryColor: userDetails()?.profile?.primaryColor
  });

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);

  createEffect(on(account.user, (user) => {
    if (!props.bot && !user) return;
    getUserDetailsRequest(props.bot?.id || account.user()?.id).then(setUserDetails);
  }));

  const requestStatus = () => requestSent() ? "Saving..." : "Save Changes";

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();

    const formattedBio = values.bio !== undefined ? formatMessage(values.bio?.trim() || "") : undefined;

    await updateUser({
      ...((values.bio !== undefined && values.bio.trim() === "") ? {bio: null} : {bio: formattedBio}),
      ...((values.bgColorOne !== undefined && values.bgColorOne === "") ? {bgColorOne: null} : {bgColorOne: values.bgColorOne}),
      ...((values.bgColorTwo !== undefined && values.bgColorTwo === "") ? {bgColorTwo: null} : {bgColorTwo: values.bgColorTwo}),
      ...((values.primaryColor !== undefined && values.primaryColor === "") ? {primaryColor: null} : {primaryColor: values.primaryColor})      

    }, props.botToken)
      .then((res) => {
        setUserDetails(() => ({ ...userDetails()!, profile: res.user.profile }));
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setRequestSent(false));
  };

  return (
    <>

      <EditBioBlock bio={inputValues().bio} setBio={v => setInputValue("bio", v)}/>

      <ProfileColorBlock userId={props.bot?.id} values={inputValues()} setValues={(k, v) => setInputValue(k, v)}>
        <Show when={Object.keys(updatedInputValues()).length}>
          <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
        </Show>
      </ProfileColorBlock>

      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
    </>
  );
}


const EditBioBlock = (props: {bio: string, setBio: (bio: string) => void}) => {
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>(null);
  return <>
    <SettingsBlock icon='info' label='Bio' class={bioBlockStyles} description='Multiline and markup support'>
      <Text size={12} style={{ "margin-left": "38px", "margin-top": "5px" }}>({props.bio.length} / 1000)</Text>
      <AdvancedMarkupOptions class="advancedMarkupOptions" updateText={props.setBio} inputElement={inputRef()!}/>
      <Input ref={setInputRef} class='inputContainer' type='textarea' value={props.bio} onText={(v) => props.setBio(v)} />
    </SettingsBlock>
  </>;
};


const ProfileColorContainer = styled(FlexRow)`
margin-top: 8px;
`;

const ColorPickerContainer = styled(FlexColumn)`
  flex: 1;
`;

const ProfileFlyoutContainer = styled(FlexColumn)`
  border-radius: 12px;
  overflow: hidden;
  outline: solid 1px rgba(255, 255, 255, 0.2);
  width: 310px;
`;

const ProfileColorBlock = (props: {userId?: string, children: JSXElement, values: {[key: string]: string | undefined}, setValues: (key: "bgColorOne" | "bgColorTwo" | "primaryColor", value: string) => void}) => {
  const {paneWidth} = useWindowProperties();
  const {createPortal} = useCustomPortal();

  const hidePreview = () => {
    return (paneWidth() || 999) < 600;
  };

  const showPreview = () => {
    createPortal(close => <ProfileFlyout userId={props.userId} close={close} bio={formatMessage(props.values.bio?.trim() || "")} colors={{ bg: [props.values.bgColorOne!, props.values.bgColorTwo!], primary: props.values.primaryColor }} />);
  };

  return (
    <ProfileColorContainer gap={6}>
      <ColorPickerContainer>
      
        <SettingsBlock icon="palette" label="Gradient Color 1"><Show when={props.values.bgColorOne}><Button onClick={() => props.setValues("bgColorOne", "")} iconName="restart_alt" padding={2}/></Show><ColorPicker color={props.values.bgColorOne!} onChange={ v => props.setValues("bgColorOne", v)} /></SettingsBlock>
        <SettingsBlock icon="palette" label="Gradient Color 2"><Show when={props.values.bgColorTwo}><Button onClick={() => props.setValues("bgColorTwo", "")} iconName="restart_alt" padding={2}/></Show><ColorPicker color={props.values.bgColorTwo!} onChange={v => props.setValues("bgColorTwo", v)} /></SettingsBlock>
        <SettingsBlock icon="palette" label="Primary Color"><Show when={props.values.primaryColor}><Button onClick={() => props.setValues("primaryColor", "")} iconName="restart_alt" padding={2}/></Show><ColorPicker color={props.values.primaryColor!} onChange={v => props.setValues("primaryColor", v)} /></SettingsBlock>
        <FlexRow style={{"align-self": "flex-end"}}>
          <Show when={hidePreview()}><Button label="Preview" iconName="visibility" onClick={showPreview} /></Show>
          {props.children}
        </FlexRow>

      </ColorPickerContainer>
      <Show when={!hidePreview()}>
        <ProfileFlyoutContainer><ProfileFlyout userId={props.userId}  bio={formatMessage(props.values.bio?.trim() || "")} colors={{ bg: [props.values.bgColorOne!, props.values.bgColorTwo!], primary: props.values.primaryColor }} dmPane /></ProfileFlyoutContainer>
      </Show>

    </ProfileColorContainer>
  );
};