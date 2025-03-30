import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useNavigate, useParams } from "solid-navigator";
import { For, createSignal, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Button from "@/components/ui/Button";

import {createWelcomeQuestion, deleteWelcomeQuestion, getWelcomeQuestions } from "@/chat-api/services/ServerService";
import { useTransContext } from "@mbarzda/solid-i18next";

import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { RawServerWelcomeQuestion } from "@/chat-api/RawData";
import { CustomLink } from "@/components/ui/CustomLink";







export default function SettingsPage() {
  const [t] = useTransContext();
  const params = useParams<{serverId: string}>();
  const { header, servers } = useStore();
  const [questions, setQuestions] = createSignal<RawServerWelcomeQuestion[]>([]);
  const navigate = useNavigate();
  


  onMount(() => {
    header.updateHeader({
      title: t("servers.settings.drawer.title") + " - " + t("servers.settings.drawer.self-assign-roles"),
      serverId: params.serverId!,
      iconName: "settings"
    });
    getWelcomeQuestions(params.serverId!).then(setQuestions);
  });
  const server = () => servers.get(params.serverId);


  const onQuestionAdded = (question: RawServerWelcomeQuestion) => {
    setQuestions([...questions(), question]);
    navigate("./" + question.id);

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
      title: t("servers.settings.selfRoles.untitledQuestion"),
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
      <SettingsBlock label={t("servers.settings.selfRoles.questions")} header={!!questions().length} description="Setup questions. Let users assign roles." icon='task_alt'>
        <Button label={t("servers.settings.selfRoles.addQuestionButton")} onClick={onAddQuestionClick} />
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
  const [t] = useTransContext();

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
      <Button label={t("servers.settings.selfRoles.deleteButton")} iconName="delete" margin={[0, 4]} iconSize={16} color="var(--alert-color)" onClick={onDeleteClick} />
      <CustomLink href={`./${props.question.id}`}><Button label={t("servers.settings.selfRoles.editButton")} iconName="edit" iconSize={16} margin={0}  /></CustomLink>
    </SettingsBlock>
  );
};

