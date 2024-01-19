import styles from "./WelcomeModal.module.scss";
import env from "@/common/env";
import { Link } from "solid-navigator";
import Button from "../ui/Button";
import Icon from "../ui/icon/Icon";
import Modal from "../ui/modal/Modal";
import { CustomLink } from "../ui/CustomLink";



export function WelcomeModal (props: {close: () => void}) {

  const ActionButtons = (
    <div class={styles.modalActionButtons}>
      <Button label="Continue" iconName="arrow_forward" onClick={props.close} />
    </div>
  )


  return (
    <Modal ignoreBackgroundClick  title={`Welcome to ${env.APP_NAME}!`} maxWidth={600} actionButtons={ActionButtons} >
      <div class={styles.modalContainer}>
        <div>Thanks for trying out {env.APP_NAME}!</div>
        <EditProfileItem />
        <ServerItem/>
        <SourceCodeItem />
        <SupportItem />
      </div>
    </Modal>
  )
}

function ServerItem() {
  return (
    <CustomLink href={`${env.APP_URL}/app/explore/servers/invites/${env.OFFICIAL_SERVER}`} target="_blank" style={{"text-decoration": "none"}}>
      <div class={styles.itemContainer} >
        <Icon name="dns" />
        <div style={{flex: 1}}>Join the official {env.APP_NAME} server!</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}

function EditProfileItem() {
  return (
    <CustomLink href="/app/settings/account" target="_blank" style={{"text-decoration": "none"}}>
        <div class={styles.itemContainer} >
        <Icon name="edit" />
        <div style={{flex: 1}} >Edit my profile</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}

function SupportItem() {
  return (
    <CustomLink href="https://ko-fi.com/supertiger" target="_blank" style={{"text-decoration": "none"}}>
      <div class={styles.itemContainer} >
        <Icon name="favorite" />
        <div style={{flex: 1}}>Support me on Ko-fi</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}
function SourceCodeItem() {
  return (
    <CustomLink href="https://github.com/Nerimity" target="_blank" style={{"text-decoration": "none"}}>
      <div class={styles.itemContainer} >
        <Icon name="code" />
        <div style={{flex: 1}}>Contribute to {env.APP_NAME} on GitHub</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}
