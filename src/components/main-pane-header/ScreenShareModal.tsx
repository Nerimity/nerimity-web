import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Button from "../ui/Button";
import { css, styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import Text from "../ui/Text";
import useStore from "@/chat-api/store/useStore";
import { ElectronCaptureSource, electronWindowAPI } from "@/common/Electron";
import { useParams } from "solid-navigator";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import Checkbox from "../ui/Checkbox";

const QualityOptions = ["480p", "720p", "1080p"] as const;
const FramerateOptions = ["1fps 💀", "10fps", "30fps", "60fps"] as const;

const OptionContainer = styled(FlexRow)``;

const ActionButtonsContainer = styled(FlexRow)`
  justify-content: flex-end;
  width: 100%;
`;

const OptionTitle = styled(Text)`
  margin-left: 5px;
`;

export function ScreenShareModal(props: { close: () => void }) {
  const params = useParams<{ channelId?: string }>();
  const store = useStore();

  const channel = () => store.channels.get(params.channelId);
  const server = () => store.servers.get(channel()?.serverId!);

  const isServerVerified = () => server()?.verified;
  const hasSupporterBadge = () =>
    hasBit(store.account.user()?.badges || 0, USER_BADGES.SUPPORTER.bit);

  const premiumQuality = () => isServerVerified() || hasSupporterBadge();

  const { voiceUsers } = useStore();
  const [selectedQuality, setSelectedQuality] =
    createSignal<(typeof QualityOptions)[number]>("480p");
  const [selectedFramerate, setFramerate] =
    createSignal<(typeof FramerateOptions)[number]>("30fps");

  const [shareSystemAudio, setShareSystemAudio] = createSignal(false);

  let electronSourceIdRef: any;

  const chooseWindowClick = async () => {
    const constraints = await constructConstraints(
      selectedQuality(),
      selectedFramerate(),
      shareSystemAudio()
    );

    if (electronWindowAPI()?.isElectron) {
      const sourceId = electronSourceIdRef();
      await electronWindowAPI()?.setDesktopCaptureSourceId(sourceId);
    }

    const stream = await navigator.mediaDevices
      .getDisplayMedia(constraints)
      .catch(() => {});

    if (!stream) return;

    voiceUsers.setVideoStream(stream);
    props.close();
  };

  const ActionButtons = (
    <ActionButtonsContainer>
      <Button label="Back" color="var(--alert-color)" onClick={props.close} />
      <Button label="Choose Window" onClick={chooseWindowClick} />
    </ActionButtonsContainer>
  );

  return (
    <LegacyModal
      title="Screen Share"
      close={props.close}
      actionButtons={ActionButtons}
    >
      <OptionTitle>Quality</OptionTitle>
      <OptionContainer>
        <For each={QualityOptions}>
          {(quality) => (
            <Show when={quality !== "1080p" || premiumQuality()}>
              <Button
                onClick={() => setSelectedQuality(quality)}
                label={quality}
                primary={selectedQuality() === quality}
              />
            </Show>
          )}
        </For>
      </OptionContainer>

      <OptionTitle>Framerate</OptionTitle>
      <OptionContainer>
        <For each={FramerateOptions}>
          {(framerate) => (
            <Show when={framerate !== "60fps" || premiumQuality()}>
              <Button
                onClick={() => setFramerate(framerate)}
                label={framerate}
                primary={selectedFramerate() === framerate}
              />
            </Show>
          )}
        </For>
      </OptionContainer>
      <Show when={electronWindowAPI()?.isElectron}>
        <Checkbox
          label="Share System Audio"
          checked={shareSystemAudio()}
          onChange={setShareSystemAudio}
          class={css`
            margin-left: 6px;
            margin-top: 10px;
            margin-bottom: 10px;
          `}
        />
      </Show>
      <Show when={electronWindowAPI()?.isElectron}>
        <ElectronCaptureSourceList ref={electronSourceIdRef} />
      </Show>
    </LegacyModal>
  );
}

const constructConstraints = async (
  quality: (typeof QualityOptions)[number],
  framerate: (typeof FramerateOptions)[number],
  audio?: boolean
) => {
  // const supportedConstraints = navigator.mediaDevices?.getSupportedConstraints();
  const constraints = {
    video: {
      height: 0,
      width: 0,
      frameRate: 0,
      resizeMode: "none",
      echoCancellation: true, // fixes screenshare echo
    },
    audio:
      electronWindowAPI()?.isElectron && !audio
        ? false
        : {
            autoGainControl: false,
            echoCancellation: true, // fixes screenshare echo
            googAutoGainControl: false,
            noiseSuppression: false,
          },
  };

  // if (supportedConstraints?.suppressLocalAudioPlayback) {
  //   (constraints.audio as any).suppressLocalAudioPlayback = true
  // }

  switch (quality) {
    case "480p":
      constraints.video.width = 848;
      constraints.video.height = 480;
      break;
    case "720p":
      constraints.video.width = 1280;
      constraints.video.height = 720;
      break;
    case "1080p":
      constraints.video.width = 1920;
      constraints.video.height = 1080;
      break;
    default:
      constraints.video.width = window.screen.width;
      constraints.video.height = window.screen.height;
      break;
  }
  switch (framerate) {
    case "1fps 💀":
      constraints.video.frameRate = 1;
      break;
    case "10fps":
      constraints.video.frameRate = 10;
      break;
    case "30fps":
      constraints.video.frameRate = 30;
      break;
    case "60fps":
      constraints.video.frameRate = 60;
      break;
    case "Source":
      constraints.video.frameRate = await getRoundedFps();
      break;
    default:
      break;
  }

  return constraints;
};

const getRoundedFps = async () => {
  return Math.round((await getFPS()) / 10) * 10;
};

const getFPS = () => {
  return new Promise<number>((resolve) => {
    let fps = 0;
    let count = 0;
    const samples = 20;
    const fpsArray = new Array(samples).fill(0);
    const sampleInterval = setInterval(() => {
      requestAnimationFrame((t1) => {
        requestAnimationFrame((t2) => {
          fpsArray[count % samples] = 1000 / (t2 - t1);
          count++;
          if (count >= samples) {
            clearInterval(sampleInterval);
            fps = fpsArray.reduce((a, b) => a + b) / samples;
            resolve(Math.round(fps));
          }
        });
      });
    }, 1000 / 60);
  });
};

const SourcesContainer = styled(FlexRow)`
  display: flex;
  flex-wrap: wrap;
  width: 670px;
  overflow: auto;
  height: 40vh;
`;

function ElectronCaptureSourceList(props: { ref: any }) {
  const [sources, setSources] = createSignal<ElectronCaptureSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = createSignal<string | null>(
    null
  );

  props.ref(() => selectedSourceId());

  const fetchSources = async () => {
    const sources = await electronWindowAPI()?.getDesktopCaptureSources()!;

    const selectedExists = sources.find(
      (source) => selectedSourceId() === source.id
    );
    if (!selectedExists) {
      setSelectedSourceId(null);
    }

    setSources(sources);
  };

  onMount(() => {
    fetchSources();
    const timeoutId = window.setInterval(fetchSources, 3000);

    onCleanup(() => clearInterval(timeoutId));
  });

  return (
    <SourcesContainer>
      <For each={sources()}>
        {(source) => (
          <SourceItem
            source={source}
            onClick={() => setSelectedSourceId(source.id)}
            selected={selectedSourceId() === source.id}
          />
        )}
      </For>
    </SourcesContainer>
  );
}

const SourceItemContainer = styled(FlexColumn)<{ selected?: boolean }>`
  align-items: center;
  width: 200px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  ${(props) =>
    props.selected
      ? `
    background-color: var(--primary-color);
  `
      : undefined}
`;
const SourceItemImage = styled("img")`
  height: 150px;
  width: 100%;
  background-color: black;
  object-fit: contain;
`;
const SourceText = styled(Text)`
  word-break: break-word;
  white-space: pre-line;
  padding: 5px;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: auto;
  text-align: center;
`;

function SourceItem(props: {
  source: ElectronCaptureSource;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <SourceItemContainer onClick={props.onClick} selected={props.selected}>
      <SourceItemImage src={props.source.thumbnailUrl} />
      <SourceText size={12}>{props.source.name}</SourceText>
    </SourceItemContainer>
  );
}
