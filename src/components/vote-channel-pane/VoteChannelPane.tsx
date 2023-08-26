import Button from '../ui/Button';
import { FlexColumn, FlexRow } from '../ui/Flexbox';
import Modal from '../ui/Modal';
import { useCustomPortal } from '../ui/custom-portal/CustomPortal';
import Input from '../ui/input/Input';
import styles from './VoteChannelPane.module.scss';

export default function VoteChannelPane() {
  const {createPortal} = useCustomPortal();
  const createNew = () => {
    createPortal(close => <CreateVoteModal {...{close}} />)
  }

  return (
    <div class={styles.voteChannelPaneContainer}>
      <Button label='Create New' primary class={styles.createButton} onClick={createNew} />
    </div>
  )
}


function CreateVoteModal(props: {close(): void;}) {
  const actionButtons = (
    <FlexRow style={{flex: 1}}>
      <Button styles={{flex: 1}} label='Go Back' color='var(--alert-color)' iconName='close' onClick={props.close}  />
      <Button styles={{flex: 1}} iconName='add_circle' label='Create' />
    </FlexRow>
  )
  return (
    <Modal icon='poll' title='New Entry' maxWidth={400} actionButtons={actionButtons} {...props} ignoreBackgroundClick>
      <FlexColumn gap={10} style={{padding: "5px"}}>
        <Input label='Title' />
        <Input label='Content' type='textarea' minHeight={100} />
      </FlexColumn>
    </Modal>
  )
}