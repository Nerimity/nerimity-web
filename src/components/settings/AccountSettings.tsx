import { createEffect, createSignal, lazy, on, onCleanup, onMount, Setter, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { deleteAccount, getUserDetailsRequest, updateUser, UserDetails } from '@/chat-api/services/UserService';
import FileBrowser, { FileBrowserRef } from '../ui/FileBrowser';
import { reconcile } from 'solid-js/store';
import Breadcrumb, { BreadcrumbItem } from '../ui/Breadcrumb';
import { t } from 'i18next';
import { Route, Routes, useMatch } from '@solidjs/router';
import { CustomLink } from '../ui/CustomLink';
import { getStorageString, setStorageString, StorageKeys } from '@/common/localStorage';
import socketClient from '@/chat-api/socketClient';
import DeleteConfirmModal from '../ui/delete-confirm-modal/DeleteConfirmModal';
import { useCustomPortal } from '../ui/custom-portal/CustomPortal';
import useServers from '@/chat-api/store/useServers';
import Modal from '../ui/Modal';

const ImageCropModal = lazy(() => import ("../ui/ImageCropModal"))

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

type UpdateHeader = Setter<{ username?: string, banner?: string; tag?: string, avatar?: any, avatarPoints?: number[] }>;

export default function AccountSettings(props: { updateHeader: UpdateHeader }) {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Account",
      iconName: 'settings',
    });
  })

  onCleanup(() => {
    props.updateHeader(reconcile({}));
  })

  const isProfilePage = useMatch(() => "app/settings/account/profile")

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t('settings.drawer.account')} href='../account' />
        <Show when={isProfilePage()}>
          <BreadcrumbItem title="Profile" />
        </Show>

      </Breadcrumb>

      <Routes>
        <Route path="/" element={<EditAccountPage updateHeader={props.updateHeader} />} />
        <Route path="/profile" element={<EditProfilePage />} />
      </Routes>
    </Container>
  )
}


const ChangePasswordButton = styled("button")`
  color: var(--primary-color);
  background-color: transparent;
  border: none;
  align-self: flex-start;
  cursor: pointer;
  user-select: none;
  &:hover {
    text-decoration: underline;
  }
`

function EditAccountPage(props: { updateHeader: UpdateHeader }) {
  const { account } = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [avatarFileBrowserRef, setAvatarFileBrowserRef] = createSignal<undefined | FileBrowserRef>()
  const [bannerFileBrowserRef, setBannerFileBrowserRef] = createSignal<undefined | FileBrowserRef>()

  const [showResetPassword, setShowResetPassword] = createSignal(false);

  const user = () => account.user();

  const defaultInput = () => ({
    email: user()?.email || '',
    username: user()?.username || '',
    tag: user()?.tag || '',
    password: '',
    newPassword: '',
    confirmNewPassword: '',
    avatar: '',
    avatarPoints: null as null | number[],
    banner: '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);


  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);

    if (updatedInputValues().newPassword) {
      if (updatedInputValues().newPassword !== updatedInputValues().confirmNewPassword) {
        setError("Confirm password does not match.")
        setRequestSent(false);
        return;
      }
    }


    const values = { ...updatedInputValues(), socketId: socketClient.id(), confirmNewPassword: undefined };
    await updateUser(values)
      .then((res) => {
        if (res.newToken) {
          setStorageString(StorageKeys.USER_TOKEN, res.newToken);
          socketClient.updateToken(res.newToken);
        }
        setShowResetPassword(false)
        setInputValue("password", '')
        setInputValue("newPassword", '')
        setInputValue("confirmNewPassword", '')
        setInputValue("avatar", '')
        setInputValue("avatarPoints", null)
        setInputValue("banner", '')
        props.updateHeader(reconcile({}));
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))

  }

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';


  const {createPortal} = useCustomPortal();

  const onCropped = (points: [number, number, number]) => {
    setInputValue("avatarPoints", points);
    props.updateHeader({ avatarPoints: points });
  }

  const onAvatarPick = (files: string[]) => {
    if (files[0]) {
      createPortal(close => <ImageCropModal close={close} image={files[0]} onCropped={onCropped} />)
      setInputValue("avatar", files[0])
      props.updateHeader({ avatar: files[0] })
    }
  }

  const onBannerPick = (files: string[]) => {
    if (files[0]) {
      setInputValue("banner", files[0])
      props.updateHeader({ banner: files[0] })

    }
  }

  const onChangePasswordClick = () => {
    setInputValue("newPassword", '')
    setInputValue("confirmNewPassword", '')
    setShowResetPassword(!showResetPassword())
  }

  return (
    <>
      <SettingsBlock icon='email' label='Email'>
        <Input value={inputValues().email} onText={(v) => setInputValue('email', v)} />
      </SettingsBlock>

      <SettingsBlock icon='face' label='Username'>
        <Input value={inputValues().username} onText={(v) => setInputValue('username', v)} />
      </SettingsBlock>

      <SettingsBlock icon='local_offer' label='Tag'>
        <Input class={css`width: 52px;`} value={inputValues().tag} onText={(v) => setInputValue('tag', v)} />
      </SettingsBlock>

      <SettingsBlock icon='wallpaper' label='Avatar' description='Supported: JPG, PNG, GIF, WEBP, Max 12 MB'>
        <FileBrowser accept='images' ref={setAvatarFileBrowserRef} base64 onChange={onAvatarPick} />
        <Show when={inputValues().avatar}>
          <Button margin={0} color='var(--alert-color)' iconSize={18} iconName='close' onClick={() => { setInputValue("avatar", ""); setInputValue("avatarPoints", null); props.updateHeader({ avatar: undefined, avatarPoints: undefined }); }} />
        </Show>
        <Button iconSize={18} iconName='attach_file' label='Browse' onClick={avatarFileBrowserRef()?.open} />
      </SettingsBlock>

      <SettingsBlock icon='panorama' label='Banner' description='Supported: JPG, PNG, GIF, WEBP, Max 12 MB'>
        <FileBrowser accept='images' ref={setBannerFileBrowserRef} base64 onChange={onBannerPick} />
        <Show when={inputValues().banner}>
          <Button margin={0} color='var(--alert-color)' iconSize={18} iconName='close' onClick={() => { setInputValue("banner", ""); props.updateHeader({ banner: undefined }); }} />
        </Show>
        <Button iconSize={18} iconName='attach_file' label='Browse' onClick={bannerFileBrowserRef()?.open} />
      </SettingsBlock>

      <SettingsBlock icon='info' label='Profile' description='Edit your bio'>
        <CustomLink href='./profile'>
          <Button iconSize={18} iconName='edit' label='Edit' />
        </CustomLink>
      </SettingsBlock>
      <ChangePasswordButton onClick={onChangePasswordClick} style={{ "margin-bottom": "5px" }}>Change Password</ChangePasswordButton>


      <Show when={showResetPassword()}>
        <SettingsBlock icon='password' label='New Password' description='Changing your password will log you out everywhere else.'>
          <Input type='password' value={inputValues().newPassword} onText={(v) => setInputValue('newPassword', v)} />
        </SettingsBlock>
        <SettingsBlock icon='password' label='Confirm New Password' description='Confirm your new password'>
          <Input type='password' value={inputValues().confirmNewPassword} onText={(v) => setInputValue('confirmNewPassword', v)} />
        </SettingsBlock>
      </Show>


      <Show when={Object.keys(updatedInputValues()).length}>
        <SettingsBlock icon='password' label='Confirm Password'>
          <Input type='password' value={inputValues().password} onText={(v) => setInputValue('password', v)} />
        </SettingsBlock>
      </Show>


      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
      </Show>

      <DeleteAccountBlock />
    </>
  )
}


const deleteAccountBlockStyles = css`
  margin-top: 50px;
  border: solid 1px var(--alert-color);
`;


function DeleteAccountBlock() {
  const {createPortal} = useCustomPortal();
  const {array} = useServers();

  const serverCount = () => array().length;

  const onDeleteClick = async (password: string) => {
    let err = "";
    await deleteAccount(password).catch(error => {
      err = error.message;
    })
    if (!err) {
      location.href = "/"
    }
    return err;
  }

  
  const onClick = () => {
    const ModalInfo = () => {
      return (
        <div style={{"margin-bottom": "15px"}}>
          What will get deleted:
          <div >• Email</div>
          <div>• Username</div>
          <div>• IP Address</div>
          <div>• Bio</div>
          <div >• And More</div>
          <div style={{"margin-top": "15px"}}>What will not get deleted:</div>
          <div>• Your Messages</div>
          <div>• Your Posts</div>
          <div style={{"margin-top": "5px", "font-size": "12px"}}>You may manually delete them before deleting your account.</div>
        </div>
      )
    }
    if (serverCount()) {
      createPortal(close => <DeleteAccountNoticeModal close={close}/>)
      return;
    }
    createPortal(close => <DeleteConfirmModal onDeleteClick={onDeleteClick} custom={<ModalInfo/>} close={close} confirmText='account' title='Delete Account' password />)
  }
  
  return (
    <SettingsBlock class={deleteAccountBlockStyles} icon='delete' label='Delete My Account' description='This cannot be undone!'>
      <Button onClick={onClick} iconSize={18} primary color='var(--alert-color)' iconName='delete' label='Delete My Account' />
    </SettingsBlock>
  )
}

function DeleteAccountNoticeModal(props: {close():void}) {
  return (
    <Modal title='Delete Account' icon='delete' actionButtons={<Button iconName='check' styles={{"margin-left": 'auto'}} label='Understood' onClick={props.close} />} maxWidth={300}>
    <Text style={{padding: "10px"}}>You must leave/delete all servers before you can delete your account.</Text>
  </Modal>
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
    margin-top: 5px;
  }
  textarea {
    height: 100px;
  }
`;

function EditProfilePage() {
  const { account } = useStore();
  const [userDetails, setUserDetails] = createSignal<UserDetails | null>(null);
  const [error, setError] = createSignal<null | string>(null);
  const [requestSent, setRequestSent] = createSignal(false);

  const defaultInput = () => ({
    bio: userDetails()?.profile?.bio || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);

  createEffect(on(account.user, (user) => {
    if (!user) return;
    getUserDetailsRequest(account.user()?.id).then(setUserDetails)
  }))

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateUser({
      bio: values.bio?.trim() || null
    })
      .then(() => {
        setUserDetails(() => ({ ...userDetails()!, profile: { bio: values.bio } }))
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setRequestSent(false))
  }

  return (
    <>
      <SettingsBlock icon='info' label='Bio' class={bioBlockStyles} description='Multiline and markup support'>
        <Text size={12} style={{ "margin-left": "38px", "margin-top": "5px" }}>({inputValues().bio.length} / 1000)</Text>
        <Input class='inputContainer' type='textarea' value={inputValues().bio} onText={(v) => setInputValue('bio', v)} />
      </SettingsBlock>
      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{ "margin-top": "5px" }}>{error()}</Text></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
      </Show>
    </>
  )
}