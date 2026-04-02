import { StorageKeys, useLocalStorage } from "./localStorage";
import { JSXElement, Show } from "solid-js";

export interface Experiment {
  id: ExperimentIds;
  name: string;
  description?: string;
  electron?: boolean;
  reactNative?: boolean;
  reloadRequired?: boolean;
  onToggle?: () => void;
}

export const Experiments = [
  // {
  //   id: "WEBSOCKET_PARTIAL_AUTH",
  //   name: "WebSocket Partial Authentication",
  //   description:
  //     "VERY BROKEN. Don't send all auth data when authenticating. This will be used in the future to speed up authentication, hopefully."
  // },
  {
    id: "WEBSOCKET_ZSTD",
    name: "WebSocket Zstandard Compression",
    description:
      "Compress some events with Zstandard compression. This can reduce bandwidth usage."
  },
  {
    id: "RN_NATIVE_WS",
    name: "React Native Native WebSocket",
    reactNative: true,
    description:
      "Use the socket.io in react native instead of webview. Will be needed for native WebRTC for stable video calls on the mobile app."
  }
] as const;

export type ExperimentIds = (typeof Experiments)[number]["id"];

const [enabledExperiments, setEnabledExperiments] = useLocalStorage<string[]>(
  StorageKeys.ENABLED_EXPERIMENTS,
  []
);

export const isExperimentEnabled = (experimentId: ExperimentIds) => {
  return () => enabledExperiments().includes(experimentId);
};
export const ShowExperiment = (props: {
  id?: ExperimentIds;
  children: JSXElement;
}) => {
  return (
    <Show when={!props.id || enabledExperiments().includes(props.id)}>
      {props.children}
    </Show>
  );
};

export const useExperiment = (experimentId: () => ExperimentIds) => {
  const experiment = () => {
    const experiment = Experiments.find(
      (experiment) => experiment.id === experimentId()
    );
    const enabled = enabledExperiments().includes(experimentId());
    if (enabled) {
      return experiment;
    }
  };
  const toggle = () => {
    const enabled = enabledExperiments().includes(experimentId());
    if (enabled) {
      setEnabledExperiments(
        enabledExperiments().filter((id) => id !== experimentId())
      );
    } else {
      setEnabledExperiments([...enabledExperiments(), experimentId()]);
    }
  };

  return {
    experiment,
    toggleExperiment: toggle
  };
};
