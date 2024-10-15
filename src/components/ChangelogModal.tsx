import { formatTimestamp } from "@/common/date";
import Marked from "@/components/marked/Marked";
import { useAppVersion } from "@/common/useAppVersion";
import { A } from "solid-navigator";
import Button from "./ui/Button";
import { FlexColumn } from "./ui/Flexbox";
import LegacyModal from "./ui/legacy-modal/LegacyModal";
import Text from "./ui/Text";
import env from "@/common/env";
import { Show } from "solid-js";

export function ChangelogModal(props: { close: () => void }) {
  const { latestRelease } = useAppVersion();

  const isRelease = env.APP_VERSION?.startsWith("v");

  const date = () => {
    const release = latestRelease();
    if (!release) return undefined;
    return formatTimestamp(new Date(release.published_at).getTime());
  };

  const ActionButtons = (
    <A
      style={{ "text-decoration": "none" }}
      href={
        isRelease
          ? "https://github.com/Nerimity/Nerimity-Web/releases"
          : "https://github.com/Nerimity/nerimity-web/commits/main"
      }
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button label="View more in GitHub" iconName="launch" />
    </A>
  );

  return (
    <LegacyModal
      title="Changelog"
      close={props.close}
      actionButtons={ActionButtons}
    >
      <FlexColumn gap={5}>
        <FlexColumn
          style={{
            "max-height": "400px",
            "max-width": "600px",
            overflow: "auto",
            padding: "5px",
          }}
        >
          <Show when={isRelease}>
            <Text size={24}>{latestRelease()?.name || ""}</Text>
            <Text opacity={0.7}>Released at {date() || ""}</Text>
            <Text opacity={0.7}>{latestRelease()?.tag_name}</Text>
            <Marked value={latestRelease()?.body!} />
          </Show>
        </FlexColumn>
      </FlexColumn>
    </LegacyModal>
  );
}
