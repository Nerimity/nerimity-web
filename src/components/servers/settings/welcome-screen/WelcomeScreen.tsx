import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useParams } from "solid-navigator";
import { For, createEffect, createSignal, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Button from "@/components/ui/Button";

import { createWelcomeQuestion, deleteWelcomeQuestion, getWelcomeQuestions, updateWelcomeQuestion } from "@/chat-api/services/ServerService";
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

  const onAddQuestionClick = () => {
    createPortal(close => <AddQuestionModal close={close} addQuestion={onQuestionAdded} />);
  };


  return (
    <div class={styles.pane}>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(params.serverId, server()?.defaultChannelId || "")} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t("servers.settings.drawer.welcome-screen")} />
      </Breadcrumb>
      <SettingsBlock label="Welcome Screen" header={!!questions().length} description="Setup welcome screen. Let users assign roles." icon='task_alt'>
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
  const {createPortal} = useCustomPortal();

  const answerList = () => props.question.answers.map(answer => answer.title).join(" • ");
  
  const onEditClick = () => {
    createPortal(close => <EditQuestionModal close={close} question={props.question} editQuestion={props.onEditQuestion} />);
  };

  const onDeleteClick = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    deleteWelcomeQuestion(params.serverId, props.question.id)
      .then(() => props.onQuestionDelete())
      .catch(err => alert(err.message));
  };

  return (
    <SettingsBlock 
      icon="question_answer"
      onClick={onEditClick} 
      description={answerList()}
      borderTopRadius={false} 
      borderBottomRadius={props.isLast} 
      label={props.question.title} >
      <Button label="Delete" iconName="delete" margin={[0, 4]} iconSize={16} color="var(--alert-color)" onClick={onDeleteClick} />
      <Button label="Edit" iconName="edit" iconSize={16} margin={0}  />
    </SettingsBlock>
  );
};




interface QuestionAnswer {
  title: string;
  roleIds: string[];
}

const AddQuestionModal = (props: {close: () => void; addQuestion?: (question: RawServerWelcomeQuestion) => void}) => {
  const params = useParams<{serverId: string}>();
  const [questionTitle, setQuestionTitle] = createSignal("");
  const [allowMultipleAnswers, setAllowMultipleAnswers] = createSignal(false);
  const [questionAnswers, setQuestionAnswers] = createStore<QuestionAnswer[]>([{title: "", roleIds: []}]);

  const setAnswer = (answer: Partial<QuestionAnswer>, index: number) => {
    if (index === questionAnswers.length - 1) {
      const newQuestionAnswers = [...questionAnswers];
      newQuestionAnswers.push({roleIds: answer.roleIds || [], title: answer.title || ""});
      setQuestionAnswers(newQuestionAnswers);
      const lastInput = [...document.querySelectorAll(`.${styles.answerForAddModalContainer} input`).values()].at(-1) as HTMLInputElement;
      lastInput.value = "";
      return;
    }
    setQuestionAnswers(index, answer);
  };

  const onAddQuestionClick = async () => {
    if (!questionTitle()) {
      return alert("Question cannot be empty");
    }
    const question = await createWelcomeQuestion(params.serverId, {
      title: questionTitle(),
      multiselect: allowMultipleAnswers(),
      answers: questionAnswers.map((answer, i) => ({order: i, title: answer.title, roleIds: answer.roleIds})).filter(answer => answer.title.trim())
    }).catch(e => alert(e.message));
    if (!question) {
      return;
    }
    props.addQuestion?.(question);
    props.close();
  };

  const onDeleteClick = (index: number) => {
    setQuestionAnswers(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <Modal title="New Question" close={props.close} ignoreBackgroundClick actionButtonsArr={[{ iconName: "add", label: "Add Question", onClick: onAddQuestionClick, primary: true}]}>
      <div class={styles.addQuestionContainer}>
        <Input label="Question" placeholder="Cats Or Dogs?" value={questionTitle()} onText={setQuestionTitle} />
        <For each={questionAnswers}>
          {(answer, i) => <AnswerForAddModal onDeleteClick={() => onDeleteClick(i())} deletable={i() !== questionAnswers.length - 1} answer={answer} setAnswer={u => setAnswer(u, i()) } />}
        </For>

        <Checkbox label="Allow multiple answers" checked={allowMultipleAnswers()} onChange={setAllowMultipleAnswers} />
      </div>
    </Modal>
  );
};



const EditQuestionModal = (props: {question: RawServerWelcomeQuestion ,close: () => void; editQuestion?: (question: RawServerWelcomeQuestion) => void}) => {
  const params = useParams<{serverId: string}>();
  const [questionTitle, setQuestionTitle] = createSignal("");
  const [allowMultipleAnswers, setAllowMultipleAnswers] = createSignal(false);
  const [questionAnswers, setQuestionAnswers] = createStore<(RawServerWelcomeAnswer)[]>([{id: Math.random().toString(), title: "", roleIds: []}]);

  createEffect(() => {
    setQuestionTitle(props.question.title);
    setAllowMultipleAnswers(props.question.multiselect);
    setQuestionAnswers(reconcile([
      ...props.question.answers,
      {id: Math.random().toString(), title: "", roleIds: []}
    ]));
  });


  const setAnswer = (answer: Partial<RawServerWelcomeAnswer>, index: number) => {
    if (index === questionAnswers.length - 1) {
      const newQuestionAnswers = [...questionAnswers];
      newQuestionAnswers.push({id: Math.random().toString(), roleIds: answer.roleIds || [], title: answer.title || ""});
      setQuestionAnswers(newQuestionAnswers);
      const lastInput = [...document.querySelectorAll(`.${styles.answerForAddModalContainer} input`).values()].at(-1) as HTMLInputElement;
      lastInput.value = "";
      return;
    }
    setQuestionAnswers(index, answer);
  };

  const onEditQuestionClick = async () => {
    if (!questionTitle()) {
      return alert("Question cannot be empty");
    }
    const question = await updateWelcomeQuestion(params.serverId, props.question.id, {
      title: questionTitle(),
      multiselect: allowMultipleAnswers(),
      answers: questionAnswers.map((answer, i) => ({order: i, id: answer.id, title: answer.title, roleIds: answer.roleIds})).filter(answer => answer.title.trim())
    }).catch(e => alert(e.message));
    if (!question) {
      return;
    }
    props.editQuestion?.(question);
    props.close();
  };
  const onDeleteClick = (index: number) => {
    setQuestionAnswers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal title="Edit Question" close={props.close} ignoreBackgroundClick actionButtonsArr={[{ iconName: "edit", label: "Edit Question", onClick: onEditQuestionClick, primary: true}]}>
      <div class={styles.addQuestionContainer}>
        <Input label="Question" placeholder="Cats Or Dogs?" value={questionTitle()} onText={setQuestionTitle} />
        <For each={questionAnswers}>
          {(answer, i) => <AnswerForAddModal  onDeleteClick={() => onDeleteClick(i())} deletable={i() !== questionAnswers.length - 1} answer={answer} setAnswer={u => setAnswer(u, i()) } />}
        </For>

        <Checkbox label="Allow multiple answers" checked={allowMultipleAnswers()} onChange={setAllowMultipleAnswers} />
      </div>
    </Modal>
  );
};

const AnswerForAddModal = (props: { onDeleteClick: () => void, deletable: boolean, answer: QuestionAnswer, setAnswer: (answer: Partial<QuestionAnswer>) => void}) => {
  const params = useParams<{serverId: string}>();
  const store = useStore();

  const server = () => store.servers.get(params.serverId!);

  const roles = () => store.serverRoles.getAllByServerId(params.serverId!).filter(role => role!.id !== server()?.defaultRoleId) as ServerRole[];

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
      <Button onClick={() => (props.deletable && props.onDeleteClick())} class={classNames(styles.deleteAnswerButton, conditionalClass(!props.deletable, styles.hidden))} color="var(--alert-color)" iconName="delete" margin={0} />
    </div>
  );
};