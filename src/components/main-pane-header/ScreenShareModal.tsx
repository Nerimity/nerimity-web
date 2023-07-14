import { For, createSignal } from "solid-js";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { styled } from "solid-styled-components";
import { FlexRow } from "../ui/Flexbox";
import Text from "../ui/Text";
import useStore from "@/chat-api/store/useStore";

const QualityOptions = ["480p", "720p", "1080p", "Source"] as const
const FramerateOptions = ["30fps", "60fps", "Source"] as const


const OptionContainer = styled(FlexRow)``;

const ActionButtonsContainer = styled(FlexRow)`
  justify-content: flex-end;
  width: 100%;
`;

const OptionTitle = styled(Text)`
  margin-left: 5px;
`;

export function ScreenShareModal(props: { close: () => void }) {
  const {voiceUsers} = useStore();
  const [selectedQuality, setSelectedQuality] = createSignal<typeof QualityOptions[number]>("480p");
  const [selectedFramerate, setFramerate] = createSignal<typeof FramerateOptions[number]>("30fps");

  const chooseWindowClick = async () => {
    const constraints = await constructConstraints(selectedQuality(), selectedFramerate());
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints).catch(() => {});
    if (!stream) return;
    voiceUsers.setVideoStream(stream);
    props.close();
  }

  const ActionButtons = (
    <ActionButtonsContainer>
      <Button label="Back" color="var(--alert-color)" onClick={props.close} />
      <Button label="Choose Window" onClick={chooseWindowClick} />
    </ActionButtonsContainer>
  )

  return (
    <Modal title="Screen Share" close={props.close} actionButtons={ActionButtons}>

      <OptionTitle>Quality</OptionTitle>
      <OptionContainer>
        <For each={QualityOptions}>
          {quality => <Button onClick={() => setSelectedQuality(quality)} label={quality} primary={selectedQuality() === quality} />}
        </For>
      </OptionContainer>

      <OptionTitle>Framerate</OptionTitle>
      <OptionContainer>
        <For each={FramerateOptions}>
          {framerate => <Button onClick={() => setFramerate(framerate)} label={framerate} primary={selectedFramerate() === framerate} />}
        </For>
      </OptionContainer>

    </Modal>
  )
}

const constructConstraints = async (quality: typeof QualityOptions[number], framerate: typeof FramerateOptions[number]) => {
  // const supportedConstraints = navigator.mediaDevices?.getSupportedConstraints();
  const constraints = {
    video: {
      height: 0,
      width: 0,
      frameRate: 0,
      resizeMode: "none",
    },
    audio: {
      autoGainControl: false,
      echoCancellation: false,
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
    case "1080p": ;
      constraints.video.width = 1920;
      constraints.video.height = 1080;
      break;
    default:
      constraints.video.width = window.screen.width;
      constraints.video.height = window.screen.height;
      break;
  }
  switch (framerate) {
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
}

const getRoundedFps = async () => {
  return Math.round((await getFPS()) / 10) * 10;
}

const getFPS = () => {
  return new Promise<number>((resolve) =>
    requestAnimationFrame((t1) =>
      requestAnimationFrame((t2) => resolve(1000 / (t2 - t1)))
    )
  );
}