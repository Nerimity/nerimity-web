import { styled } from "solid-styled-components";
import Button from "./Button";
import { FlexColumn, FlexRow } from "./Flexbox";
import Modal from "./Modal";
import Text from "./Text";

const ModalContainer = styled(FlexColumn)`
  align-items: center;
  padding: 10px;
  padding-top: 20px;
  padding-bottom: 20px;
`

const LinkContainer = styled(FlexRow)`
  padding: 5px;
  background-color: rgba(255,255,255,0.1);
  border-radius: 6px;
  color: var(--primary-color);
  text-align: center;
`

export function DangerousLinkModal(props : {unsafeUrl: string; close(): void;}) {
  const url = () => {
    const startsWithHttp = props.unsafeUrl.startsWith("http://");
    const startsWithHttps = props.unsafeUrl.startsWith("https://")
    if (startsWithHttp || startsWithHttps) return props.unsafeUrl;
    return `https://${props.unsafeUrl}`
  }

  const visitLink = () => {
    props.close();
    window.open(url(), '_blank')?.focus();
  }

  const ActionButtons = (
    <FlexRow style={{ "margin-left": 'auto' }}>
      <Button label="Don't Visit" onClick={props.close} color='var(--alert-color)' iconName='close' />
      <Button label='Visit' iconName='done' onClick={visitLink} />
    </FlexRow>
  )

  return (
    <Modal title='Custom Link' icon='link' actionButtons={ActionButtons} maxWidth={400}>
      <ModalContainer gap={10}>
        <Text>This link will take you to</Text>
        <LinkContainer>{url()}</LinkContainer>
      </ModalContainer>
    </Modal>
  )
}