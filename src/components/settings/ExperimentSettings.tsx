import { For, Show, createEffect } from "solid-js";
import { styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import { Experiment, Experiments, useExperiment } from "@/common/experiments";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Checkbox from "../ui/Checkbox";


const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;


export default function LanguageSettings() {
  const { header } = useStore();


  createEffect(() => {
    header.updateHeader({
      title: "Settings - Experiments",
      iconName: "settings"
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t("settings.drawer.experiments")} />
      </Breadcrumb>

      <Show when={!Experiments.length}><div>There are currently no experiments available.</div></Show>

      <For each={Experiments}>
        {experiment => <ExperimentItem experiment={experiment} />}
      </For>


    </Container>
  );
}



const ExperimentItem = (props: { experiment: Experiment }) => {
  const {experiment, toggleExperiment} = useExperiment(() => props.experiment.id);
  return (
    <SettingsBlock onClick={() => toggleExperiment()} label={props.experiment.name} description={props.experiment.description}>
      <Checkbox checked={!!experiment()}  />
    </SettingsBlock>
  );
};