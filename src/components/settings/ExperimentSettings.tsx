import { For, Show, createEffect } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import { Experiment, Experiments, useExperiment } from "@/common/experiments";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import Checkbox from "../ui/Checkbox";
import { electronWindowAPI } from "@/common/Electron";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import Text from "../ui/Text";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import env from "@/common/env";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function ExperimentsSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.experiments"),
      iconName: "settings",
    });
  });

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.experiments")} />
      </Breadcrumb>

      <Show when={!Experiments.length}>
        <div>{t("settings.experiments.noExperiments")}</div>
      </Show>

      <For each={Experiments}>
        {(experiment) => <ExperimentItem experiment={experiment} />}
      </For>
    </Container>
  );
}

const disabledStyles = css`
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
`;
const ExperimentItem = (props: { experiment: Experiment }) => {
  const { createPortal } = useCustomPortal();
  const { experiment, toggleExperiment } = useExperiment(
    () => props.experiment.id
  );
  const disabled = () => {
    if (props.experiment.electron && !electronWindowAPI()?.isElectron) {
      return true;
    }
    return false;
  };

  const toggle = () => {
    if (props.experiment.reloadRequired) {
      createPortal((close) => <ReloadRequiredModal close={close} />);
    }
    props.experiment.onToggle?.();
    toggleExperiment();
  };

  return (
    <SettingsBlock
      class={disabled() ? disabledStyles : undefined}
      onClick={toggle}
      label={props.experiment.name}
      description={props.experiment.description}
    >
      <Checkbox checked={!!experiment()} />
    </SettingsBlock>
  );
};

const ReloadRequiredModal = (props: { close: () => void }) => {
  const restart = () => electronWindowAPI()?.relaunchApp();
  return (
    <LegacyModal
      title="Reload Required"
      close={props.close}
      ignoreBackgroundClick
      actionButtonsArr={[
        { label: "Restart Later", onClick: props.close },
        { label: "Restart Now", primary: true, onClick: restart },
      ]}
    >
      <div
        class={css`
          padding: 10px;
          max-width: 230px;
          text-align: center;
        `}
      >
        <Text>Nerimity needs to be restarted to take effect.</Text>
      </div>
    </LegacyModal>
  );
};
