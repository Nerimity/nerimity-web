import styles from "./WelcomeModal.module.scss";
import env from "@/common/env";
import { Link } from "solid-navigator";
import Button from "../ui/Button";
import Icon from "../ui/icon/Icon";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { CustomLink } from "../ui/CustomLink";
import { t } from "i18next";

export function WelcomeModal(props: { close: () => void }) {
  const ActionButtons = (
    <div class={styles.modalActionButtons}>
      <Button label="Continue" iconName="arrow_forward" onClick={props.close} />
    </div>
  );

  return (
    <LegacyModal
      ignoreBackgroundClick
      title={t("welcome.title")}
      maxWidth={600}
      actionButtons={ActionButtons}
    >
      <div class={styles.modalContainer}>
        <div>{t("welcome.description")}</div>
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
        <div style={{ flex: 1 }}>{t("welcome.joinServer")}</div>
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
        <div style={{ flex: 1 }}>{t("welcome.editProfile")}</div>
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
        <div style={{ flex: 1 }}>{t("welcome.supportMe", { platform: "Ko-Fi" })}</div>
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
        <div style={{ flex: 1 }}>{t("welcome.supportMe", { platform: "Boosty" })}</div>
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
        <div style={{ flex: 1 }}>{t("welcome.contribute")}</div>
        <Icon name="open_in_new" />
      </div>
    </CustomLink>
  );
}
