import { formatTimestamp } from "@/common/date";
import Marked from "@/common/Marked";
import { useAppVersion } from "@/common/useAppVersion";
import { FlexColumn } from "./ui/Flexbox";
import Modal from "./ui/Modal";
import Text from "./ui/Text";

export function ChangelogModal (props: {close: () => void}) {
  const {latestRelease} = useAppVersion(); 
  
  const date = () => {
    const release = latestRelease();
    if (!release) return undefined;
    return formatTimestamp(new Date(release.published_at).getTime())
  }

  return (
    <Modal title="App Updated" close={props.close}>
    <FlexColumn gap={5}>
      <FlexColumn style={{"max-height": "300px", "max-width": "500px", overflow: "auto"}}>
        <Text size={24}>{latestRelease()?.name || ""}</Text>
        <Text opacity={0.7}>Released at {date() || ""}</Text>
        <Text opacity={0.7}>{latestRelease()?.tag_name}</Text>
        <Marked value={latestRelease()?.body!} />
      </FlexColumn>
    </FlexColumn>
    </Modal>
  )
}