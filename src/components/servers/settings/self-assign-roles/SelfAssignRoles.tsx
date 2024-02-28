import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useParams } from "solid-navigator";
import { For, Show, createSignal, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Button from "@/components/ui/Button";

import { createServerRole } from "@/chat-api/services/ServerService";
import { useTransContext } from "@mbarzda/solid-i18next";

import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Modal from "@/components/ui/modal/Modal";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Input from "@/components/ui/input/Input";
import { createStore, reconcile } from "solid-js/store";
import DropDown, { DropDownItem } from "@/components/ui/drop-down/DropDown";
import { classNames, conditionalClass } from "@/common/classNames";
import Checkbox from "@/components/ui/Checkbox";
import { ServerRole } from "@/chat-api/store/useServerRoles";
import MultiSelectDropDown from "@/components/ui/multi-select-drop-down/MultiSelectDropDown";
import { Rerun } from "@solid-primitives/keyed";







export default function SettingsPage() {
  const [t] = useTransContext();
  const params = useParams<{serverId: string}>();
  const { header, servers } = useStore();
  const {createPortal} = useCustomPortal();


  onMount(() => {
    header.updateHeader({
      title: "Settings - Self Assign Roles",
      serverId: params.serverId!,
      iconName: "settings"
    });
    onAddQuestionClick();
  });
  const server = () => servers.get(params.serverId);

  const onAddQuestionClick = () => {
    createPortal(close => <AddQuestionModal close={close} />);
  };


  return (
    <div class={styles.pane}>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(params.serverId, server()?.defaultChannelId!)} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t("servers.settings.drawer.welcome-screen")} />
      </Breadcrumb>
      <SettingsBlock label="Welcome Screen" description="Setup welcome screen. Let users assign roles." icon='task_alt'>
        <Button label="Add Question" onClick={onAddQuestionClick} />
      </SettingsBlock>
    </div>
  );
}

interface QuestionAnswer {
  title: string;
  roleIds: string[];
}

const AddQuestionModal = (props: {close: () => void}) => {
  const [questionTitle, setQuestionTitle] = createSignal("");
  const [allowMultipleAnswers, setAllowMultipleAnswers] = createSignal(false);
  const [questionAnswers, setQuestionAnswers] = createStore<QuestionAnswer[]>([{title: "", roleIds: []}]);

  const setAnswer = (answer: Partial<QuestionAnswer>, index: number) => {
    if (index === questionAnswers.length - 1) {
      const newQuestionAnswers = [...questionAnswers];
      newQuestionAnswers.push({roleIds: answer.roleIds || [], title: answer.title || ""});
      setQuestionAnswers(newQuestionAnswers);
      setQuestionAnswers(questionAnswers.length - 1, {title: "", roleIds: []});
      return;
    }
    setQuestionAnswers(index, answer);

  };


  return (
    <Modal title="New Question" close={props.close} ignoreBackgroundClick actionButtonsArr={[{ iconName: "add", label: "Add Question", onClick: () => {}, primary: true}]}>
      <div class={styles.addQuestionContainer}>
        <Input label="Question" placeholder="Cats Or Dogs?" value={questionTitle()} onText={setQuestionTitle} />

        <For each={questionAnswers}>
          {(answer, i) => <AnswerForAddModal deletable={i() !== questionAnswers.length - 1} answer={answer} setAnswer={u => setAnswer(u, i()) } />}
        </For>


        <Checkbox label="Allow multiple answers" checked={allowMultipleAnswers()} onChange={setAllowMultipleAnswers} />
      </div>
    </Modal>
  );
};

const AnswerForAddModal = (props: {deletable: boolean, answer: QuestionAnswer, setAnswer: (answer: Partial<QuestionAnswer>) => void}) => {
  const params = useParams<{serverId: string}>();
  const store = useStore();

  const roles = () => store.serverRoles.getAllByServerId(params.serverId!) as ServerRole[];

  const roleItems = () => roles().map(role => {
    return {
      id: role.id,
      label: role.name
    } as DropDownItem;
  });

  
  return (
    <div class={styles.answerForAddModalContainer}>
      <Input class={styles.answerInput} label="Answer" placeholder="Cats" value={props.answer.title} onText={t => props.setAnswer({title: t})} />
      <MultiSelectDropDown items={roleItems()} selectedIds={props.answer.roleIds} onChange={items => props.setAnswer({roleIds: items.map(item => item.id)})}  title="Select Roles" />
      <Button class={classNames(styles.deleteAnswerButton, conditionalClass(!props.deletable, styles.hidden))} color="var(--alert-color)" iconName="delete" margin={0} />
    </div>
  );
};