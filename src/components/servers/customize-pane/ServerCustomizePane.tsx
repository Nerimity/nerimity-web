import styles from "./styles.module.scss";

import { useParams } from "solid-navigator";
import { For, Show, createEffect, createSignal, on, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { getWelcomeQuestions } from "@/chat-api/services/ServerService";
import { RawServerWelcomeAnswer, RawServerWelcomeQuestion } from "@/chat-api/RawData";
import Checkbox from "@/components/ui/Checkbox";
import Icon from "@/components/ui/icon/Icon";
import Text from "@/components/ui/Text";

export default function Pane() {
  const params = useParams<{serverId: string}>();
  const { header } = useStore();

  const [questions, setQuestions] = createSignal<RawServerWelcomeQuestion[]>([]);


  createEffect(on(() => params.serverId, async () => {
    const questions = await getWelcomeQuestions(params.serverId!);
    setQuestions(questions);
  }));

  onMount(() => {
    header.updateHeader({
      title: "Customize",
      serverId: params.serverId!,
      iconName: "tune"
    });
  });

  return (
    <div class={styles.pane}>  
      <WelcomeMessage/>
      <QuestionList questions={questions()} />
    </div>
  );
}

const WelcomeMessage = () => {
  const params = useParams<{serverId: string}>();
  const store = useStore();
  const server = () => store.servers.get(params.serverId!);

  return (
    <div class={styles.welcomeMessage}>
      <Text size={24}>{server()?.name}</Text>
      <Text size={14} opacity={0.6}>Complete these questions to get roles:</Text>
    </div>
  );
};

const QuestionList = (props: {questions: RawServerWelcomeQuestion[]}) => {
  return (
    <div class={styles.questionList}>
      <For each={props.questions}>
        {(question) => <QuestionItem question={question} />}
      </For>
    </div>
  );
};

const QuestionItem = (props: {question: RawServerWelcomeQuestion}) => {
  return (
    <div class={styles.questionItem}>
      <div>{props.question.title}</div>
      <Show when={props.question.answers.length}><AnswerList answers={props.question.answers}/></Show>
    </div>
  );
};

const AnswerList = (props: {answers: RawServerWelcomeAnswer[]}) => {
  return (
    <div class={styles.answerList}>
      <For each={props.answers}>
        {(answer) => <AnswerItem answer={answer} />}
      </For>
    </div>
  );
};

const AnswerItem = (props: {answer: RawServerWelcomeAnswer}) => {
  return (
    <div class={styles.answerItem}>
      <Checkbox checked={false} labelSize={14} label={props.answer.title} class={styles.checkbox} />
      <UserCount/>
    </div>
  );
};

const UserCount = () => {
  return (
    <div class={styles.userCount}>
      <Icon name="person" size={14} />
      <div>{(1002).toLocaleString()}</div>
    </div>
  );
};