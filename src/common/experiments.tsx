import { StorageKeys, useReactiveLocalStorage } from "./localStorage";
import { JSXElement, Show } from "solid-js";

export interface Experiment {
  id: ExperimentIds;
  name: string;
  description?: string;
  electron?: boolean
  reloadRequired?: boolean
}

export const Experiments = [
  {
    id: "CREATE_APPS",
    name: "Create Applications",
    description: "Enables developer option to settings. Lets you create bots.",
    reloadRequired: false,
    electron: false
  },
  {
    id: "RPC_SERVER",
    name: "Start local RPC Server.",
    description: "Rich Presence details for a supported program activity",
    reloadRequired: true,
    electron: true
  }
] as const;

export type ExperimentIds = typeof Experiments[number]["id"];

const [enabledExperiments, setEnabledExperiments] = useReactiveLocalStorage<string[]>(StorageKeys.ENABLED_EXPERIMENTS, []);

export const isExperimentEnabled = (experimentId: ExperimentIds) => {
  return enabledExperiments().includes(experimentId);
};
export const ShowExperiment = (props: {id?: ExperimentIds, children: JSXElement}) => {
  return (
    <Show when={!props.id || enabledExperiments().includes(props.id)}>
      {props.children}
    </Show>
  );
};

export const useExperiment = (experimentId: () => ExperimentIds) => {

  const experiment = () => {
    const experiment = Experiments.find(experiment => experiment.id === experimentId());
    const enabled = enabledExperiments().includes(experimentId());
    if (enabled) {
      return experiment;
    }
  };
  const toggle = () => {
    const enabled = enabledExperiments().includes(experimentId());
    if (enabled) {
      setEnabledExperiments(enabledExperiments().filter(id => id !== experimentId()));
    }    
    else {
      setEnabledExperiments([...enabledExperiments(), experimentId()]);
    }
  };

  return {
    experiment,
    toggleExperiment: toggle
  };
};