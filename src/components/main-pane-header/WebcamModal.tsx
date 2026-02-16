import { createSignal, onCleanup, onMount } from "solid-js";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Button from "../ui/Button";
import { styled } from "solid-styled-components";
import { FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";
import { toast } from "../ui/custom-portal/CustomPortal";

const ActionButtonsContainer = styled(FlexRow)`
  justify-content: flex-end;
  width: 100%;
`;

export function WebcamModal(props: { close: () => void }) {
  const { voiceUsers } = useStore();

  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = createSignal<string>("default");

  onMount(async () => {
    // requests for camera permission.
    await navigator.mediaDevices
      .getUserMedia({ audio: false, video: true })
      .then((s) => s.getTracks().forEach((track) => track.stop()))
      .catch(() => {});

    fetchDevices();
    const timeoutId = setTimeout(() => {
      fetchDevices();
    }, 3000);

    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  });

  const fetchDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const webcamDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );

    setDevices(webcamDevices);
  };

  const shareCameraClick = async () => {
    const stream = await navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          deviceId: selectedId(),
          frameRate: 30,
          width: 1280,
          height: 720
        }
      })
      .catch((err) => {
        console.error(err);
        toast("Failed to share camera");
      });
    if (!stream) return;
    voiceUsers.setVideoStream(stream);
    props.close();
  };

  const ActionButtons = (
    <ActionButtonsContainer>
      <Button label="Back" color="var(--alert-color)" onClick={props.close} />
      <Button label="Share Camera" onClick={shareCameraClick} />
    </ActionButtonsContainer>
  );

  const dropdownItems: () => DropDownItem[] = () => [
    { id: "default", label: "Default" },
    ...devices().map((device) => ({
      id: device.deviceId,
      label: device.label
    }))
  ];

  return (
    <LegacyModal
      title="Share Webcam"
      close={props.close}
      actionButtons={ActionButtons}
    >
      <DropDown
        items={dropdownItems()}
        selectedId={selectedId()}
        onChange={(i) => setSelectedId(i.id)}
      />
    </LegacyModal>
  );
}
