import { JSX } from "solid-js";
import { FlexColumn } from "../../ui/Flexbox";
import Text from "../../ui/Text";
import Button from "../../ui/Button";
import LegacyModal from "../../ui/legacy-modal/LegacyModal";
import { t } from "@nerimity/i18lite";

export function ToastModal(props: {
  title: string;
  body?: JSX.Element | string;
  icon?: string;
  close: () => void;
}) {
  const ActionButtons = (
    <Button
      label={t("message.dismissButton")}
      onClick={props.close}
      iconName="close"
      color="var(--alert-color)"
    />
  );

  return (
    <LegacyModal
      title={props.title}
      close={props.close}
      color="var(--alert-color)"
      ignoreBackgroundClick
      icon={props.icon}
      actionButtons={ActionButtons}
      maxWidth={300}
    >
      <FlexColumn gap={5} style={{ "text-align": "center" }}>
        {typeof props.body === "string" ? <Text size={14}>{props.body}</Text> : props.body}
      </FlexColumn>
    </LegacyModal>
  );
}
