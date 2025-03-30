import { styled } from "solid-styled-components";
import Button from "./Button";
import { FlexColumn, FlexRow } from "./Flexbox";
import LegacyModal from "./legacy-modal/LegacyModal";
import Text from "./Text";
import { useTransContext } from "@mbarzda/solid-i18next";

const ModalContainer = styled(FlexColumn)`
  align-items: center;
  padding: 10px;
  padding-top: 20px;
  padding-bottom: 20px;
`;

const LinkContainer = styled(FlexRow)`
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--primary-color);
  text-align: center;
  word-break: break-all;
`;

export function DangerousLinkModal(props: {
  unsafeUrl: string;
  close(): void;
}) {
  const url = () => {
    const startsWithHttp = props.unsafeUrl.startsWith("http://");
    const startsWithHttps = props.unsafeUrl.startsWith("https://");
    if (startsWithHttp || startsWithHttps) return props.unsafeUrl;
    return `https://${props.unsafeUrl}`;
  };

  const visitLink = () => {
    props.close();
    window.open(url(), "_blank")?.focus();
  };

  const [t] = useTransContext();

  const ActionButtons = (
    <FlexRow style={{ "margin-left": "auto" }}>
      <Button
        label={t("dangerousLink.cancelButton")}
        onClick={props.close}
        color="var(--alert-color)"
        iconName="close"
      />
      <Button label={t("dangerousLink.visitButton")} iconName="done" onClick={visitLink} />
    </FlexRow>
  );

  return (
    <LegacyModal
      title={t("dangerousLink.title")}
      icon="link"
      actionButtons={ActionButtons}
      maxWidth={400}
      close={props.close}
    >
      <ModalContainer gap={10}>
        <Text>{t("dangerousLink.text")}</Text>
        <LinkContainer>{url()}</LinkContainer>
      </ModalContainer>
    </LegacyModal>
  );
}
