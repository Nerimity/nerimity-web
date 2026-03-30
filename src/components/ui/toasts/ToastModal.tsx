import { createSignal, JSX, Show } from "solid-js";
import { FlexColumn } from "../../ui/Flexbox";
import Text from "../../ui/Text";
import Button from "../../ui/Button";
import LegacyModal from "../../ui/legacy-modal/LegacyModal";
import { t } from "@nerimity/i18lite";
import Input from "../input/Input";

export default function ToastModal(props: {
  title: string;
  body?: JSX.Element | string;
  icon?: string;
  close: () => void;
  prompt?: boolean;
  onSubmit?: (value: string) => void;
}) {
  const [value, setValue] = createSignal("");
  const ActionButtons = (
    <Button
      label={props.prompt ? "Submit" : t("message.dismissButton")}
      onClick={() => {
        props.onSubmit?.(value());
        props.close();
      }}
      iconName={props.prompt ? "check" : "close"}
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
        {typeof props.body === "string" ? (
          <Text size={14}>{props.body}</Text>
        ) : (
          props.body
        )}
        <Show when={props.prompt}>
          <Input type="textarea" onText={setValue} value={value()} />
        </Show>
      </FlexColumn>
    </LegacyModal>
  );
}
