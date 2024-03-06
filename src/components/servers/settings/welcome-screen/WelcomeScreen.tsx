import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useParams } from "solid-navigator";
import { For, createEffect, createSignal, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Button from "@/components/ui/Button";

import { UpdateAnswer, UpdateQuestion, createWelcomeQuestion, deleteWelcomeQuestion, getWelcomeQuestions, updateWelcomeQuestion } from "@/chat-api/services/ServerService";
import { useTransContext } from "@mbarzda/solid-i18next";

import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Modal from "@/components/ui/modal/Modal";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Input from "@/components/ui/input/Input";
import { createStore, reconcile } from "solid-js/store";
import  { DropDownItem } from "@/components/ui/drop-down/DropDown";
import { classNames, conditionalClass } from "@/common/classNames";
import Checkbox from "@/components/ui/Checkbox";
import { ServerRole } from "@/chat-api/store/useServerRoles";
import MultiSelectDropDown from "@/components/ui/multi-select-drop-down/MultiSelectDropDown";
import { RawServerWelcomeAnswer, RawServerWelcomeQuestion } from "@/chat-api/RawData";
import { CustomLink } from "@/components/ui/CustomLink";







export default function SettingsPage() {
  const [t] = useTransContext();
  const params = useParams<{serverId: string}>();
  const { header, servers } = useStore();
  const {createPortal} = useCustomPortal();
  const [questions, setQuestions] = createSignal<RawServerWelcomeQuestion[]>([]);
  


  onMount(() => {
    header.updateHeader({
      title: "Settings - Self Assign Roles",
      serverId: params.serverId!,
      iconName: "settings"
    });
    getWelcomeQuestions(params.serverId!).then(setQuestions);
  });
  const server = () => servers.get(params.serverId);


  const onQuestionAdded = (question: RawServerWelcomeQuestion) => {
    setQuestions([...questions(), question]);
  };

  const onQuestionEdited = (question: RawServerWelcomeQuestion) => {
    setQuestions(prev => {
      const previousVal = [...prev];
      const index = previousVal.findIndex(q => q.id === question.id);
      previousVal[index] = question;
      return previousVal;
    });
  };

  const onQuestionDeleted = (question: RawServerWelcomeQuestion) => {
    setQuestions(prev => prev.filter(q => q.id !== question.id));
  };

  const onAddQuestionClick = async () => {
    const question = await createWelcomeQuestion(params.serverId, {
      title: "Untitled Question",
      multiselect: false,
      answers: []
    }).catch(e => alert(e.message));
    if (!question) return;
    onQuestionAdded(question);
  };


  return (
    <div class={styles.pane}>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(params.serverId, server()?.defaultChannelId || "")} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t("servers.settings.drawer.welcome-screen")} />
      </Breadcrumb>
      <SettingsBlock label="Questions" header={!!questions().length} description="Setup questions. Let users assign roles." icon='task_alt'>
        <Button label="Add Question" onClick={onAddQuestionClick} />
      </SettingsBlock>
      <QuestionList questions={questions()}  onEditQuestion={onQuestionEdited} onQuestionDelete={onQuestionDeleted} />
    </div>
  );
}

const QuestionList = (props: {questions: RawServerWelcomeQuestion[], onQuestionDelete: (question: RawServerWelcomeQuestion) => void; onEditQuestion?: (question: RawServerWelcomeQuestion) => void}) => {

  return (
    <For each={props.questions.sort((a, b) => a.order! - b.order!)}>
      {(question, i) => <QuestionItem question={question} onQuestionDelete={() => props.onQuestionDelete(question)} onEditQuestion={props.onEditQuestion} isLast={props.questions.length - 1 === i()} />}
    </For>
  );
};

const QuestionItem = (props: {question: RawServerWelcomeQuestion, isLast: boolean, onQuestionDelete: () => void; onEditQuestion?: (question: RawServerWelcomeQuestion) => void}) => {
  const params = useParams<{serverId: string}>();
  const answerList = () => props.question.answers.map(answer => answer.title).join(" • ");
  

  const onDeleteClick = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    deleteWelcomeQuestion(params.serverId, props.question.id)
      .then(() => props.onQuestionDelete())
      .catch(err => alert(err.message));
  };

  return (
    <SettingsBlock 
      icon="help"
      
      description={answerList()}
      borderTopRadius={false} 
      borderBottomRadius={props.isLast} 
      label={props.question.title} >
      <Button label="Delete" iconName="delete" margin={[0, 4]} iconSize={16} color="var(--alert-color)" onClick={onDeleteClick} />
      <CustomLink href={`./${props.question.id}`}><Button label="Edit" iconName="edit" iconSize={16} margin={0}  /></CustomLink>
    </SettingsBlock>
  );
};

