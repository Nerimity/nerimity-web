import styles from "./WelcomeModal.module.scss";
import env from "@/common/env";
import Button from "../ui/Button";
import Icon from "../ui/icon/Icon";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { CustomLink } from "../ui/CustomLink";
import { t } from "@nerimity/i18lite";

export function WelcomeModal(props: { close: () => void }) {
  const ActionButtons = (
    <div class={styles.modalActionButtons}>
      <Button label={t("general.doneButton")} iconName="arrow_forward" onClick={props.close} />
    </div>
  );

  return (
    <LegacyModal
      ignoreBackgroundClick
      title={t("registerPage.title", { appName: "Nerimity" })}
      maxWidth={600}
      actionButtons={ActionButtons}
    >
      <div class={styles.modalContainer}>
        <div>{t("welcomePopup.subtitle")}</div>
        <EditProfileItem />
        <ServerItem />
        <SourceCodeItem />
        <SupportKofiItem />
        <SupportBoostyItem />
      </div>
    </LegacyModal>
  );
}

function ServerItem() {
  return (
    <CustomLink
      href={`${env.APP_URL}/app/explore/servers/invites/${env.OFFICIAL_SERVER}`}
      target="_blank"
      style={{ "text-decoration": "none" }}
    >
      <div class={styles.itemContainer}>
        <Icon name="dns" />
        <div style={{ flex: 1 }}>{t("welcomePopup.joinServer")}</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}

function EditProfileItem() {
  return (
    <CustomLink
      href="/app/settings/account"
      target="_blank"
      style={{ "text-decoration": "none" }}
    >
      <div class={styles.itemContainer}>
        <Icon name="edit" />
        <div style={{ flex: 1 }}>{t("welcomePopup.editProfile")}</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}

function SupportKofiItem() {
  return (
    <CustomLink
      href="https://ko-fi.com/supertiger"
      target="_blank"
      style={{ "text-decoration": "none" }}
    >
      <div class={styles.itemContainer}>
        <Icon name="favorite" />
        <div style={{ flex: 1 }}>{t("welcomePopup.support", { platform: "Ko-Fi" })}</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}
function SupportBoostyItem() {
  return (
    <CustomLink
      href="https://boosty.to/supertigerdev/donate"
      target="_blank"
      style={{ "text-decoration": "none" }}
    >
      <div class={styles.itemContainer}>
        <Icon name="favorite" />
        <div style={{ flex: 1 }}>{t("welcomePopup.support", { platform: "Boosty" })}</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}
function SourceCodeItem() {
  return (
    <CustomLink
      href="https://github.com/Nerimity"
      target="_blank"
      style={{ "text-decoration": "none" }}
    >
      <div class={styles.itemContainer}>
        <Icon name="code" />
        <div style={{ flex: 1 }}>{t("welcomePopup.contribute")}</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}
