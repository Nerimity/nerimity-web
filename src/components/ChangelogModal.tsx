import Marked from "@/common/Marked";
import { useAppVersion } from "@/common/useAppVersion";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Modal from "./ui/modal/Modal";
import Text from "./ui/Text";

export function ChangelogModal (props: {close: () => void}) {
  const {latestRelease} = useAppVersion();
  return (
    <Modal title="App Updated">
    <FlexColumn gap={5}>
      <Text opacity={0.8}>Nerimity has been updated!</Text>
      <FlexRow style={{height: "300px", "max-width": "500px", overflow: "auto"}}>
        <Marked value={latestRelease()?.body!} />
      </FlexRow>
      <FlexRow style={{"margin-left": "-5px"}}>
        <Button iconName='done' onClick={props.close} label='Close'/>
      </FlexRow>
    </FlexColumn>
    </Modal>
  )
}