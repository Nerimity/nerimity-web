import { formatTimestamp } from "@/common/date";
import Marked from "@/common/Marked";
import { useAppVersion } from "@/common/useAppVersion";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Modal from "./ui/modal/Modal";
import Text from "./ui/Text";

export function ChangelogModal (props: {close: () => void}) {
  const {latestRelease} = useAppVersion(); 
  
  const date = () => {
    const release = latestRelease();
    if (!release) return undefined;
    return formatTimestamp(new Date(release.published_at).getTime())
  }

  return (
    <Modal title="App Updated">
    <FlexColumn gap={5}>
      <FlexColumn style={{"max-height": "300px", "max-width": "500px", overflow: "auto"}}>
        <Text size={24}>{latestRelease()?.name || ""}</Text>
        <Text opacity={0.7}>Released at {date() || ""}</Text>
        <Text opacity={0.7}>{latestRelease()?.tag_name}</Text>
        <Marked value={latestRelease()?.body!} />
      </FlexColumn>
      <FlexRow style={{"margin-left": "-5px"}}>
        <Button iconName='done' onClick={props.close} label='Close'/>
      </FlexRow>
    </FlexColumn>
    </Modal>
  )
}