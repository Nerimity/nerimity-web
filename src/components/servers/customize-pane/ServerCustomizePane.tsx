import styles from "./styles.module.scss";

import { useParams } from "solid-navigator";
import { For, Setter, Show, batch, createEffect, createSignal, on, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { addAnswerToMember, getWelcomeQuestions, removeAnswerFromMember, updateWelcomeQuestion } from "@/chat-api/services/ServerService";
import { RawServerWelcomeAnswer, RawServerWelcomeQuestion } from "@/chat-api/RawData";
import Checkbox from "@/components/ui/Checkbox";
import Icon from "@/components/ui/icon/Icon";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import { CustomLink } from "@/components/ui/CustomLink";
import RouterEndpoints from "@/common/RouterEndpoints";
import { RadioBoxItem } from "@/components/ui/RadioBox";
import { SetStoreFunction, createStore, reconcile } from "solid-js/store";

export default function Pane() {
  const params = useParams<{serverId: string}>();
  const { header } = useStore();

  const [questions, setQuestions] = createStore<RawServerWelcomeQuestion[]>([]);


  createEffect(on(() => params.serverId, async () => {
    const questions = await getWelcomeQuestions(params.serverId!);
    setQuestions(reconcile(questions));
  }));

  onMount(() => {
    header.updateHeader({
      title: "Customize",
      serverId: params.serverId!,
      iconName: "tune"
    });
  });

  return (
    <>
      <div class={styles.pane}>  
        <WelcomeMessage/>
        <QuestionList questions={questions} updateQuestions={setQuestions} />
      </div>
      <ContinueFooter/>
    </>
  );
}

const WelcomeMessage = () => {
  const params = useParams<{serverId: string}>();
  const store = useStore();
  const server = () => store.servers.get(params.serverId!);

  return (
    <div class={styles.welcomeMessage}>
      <Text size={24} class={styles.title}>{server()?.name}</Text>
      <Text size={16} opacity={0.6}>Complete these questions:</Text>
    </div>
  );
};

const QuestionList = (props: {questions: RawServerWelcomeQuestion[], updateQuestions: SetStoreFunction<RawServerWelcomeQuestion[]>}) => {
  return (
    <div class={styles.questionList}>
      <For each={props.questions.toSorted((a, b) => a.order - b.order)}>
        {(question) => <QuestionItem questions={props.questions} question={question} updateQuestions={props.updateQuestions} />}
      </For>
    </div>
  );
};

const QuestionItem = (props: {question: RawServerWelcomeQuestion; questions: RawServerWelcomeQuestion[], updateQuestions: SetStoreFunction<RawServerWelcomeQuestion[]>}) => {
  return (
    <div class={styles.questionItem}>
      <div class={styles.title}>{props.question.title}</div>
      <Show when={props.question.answers.length}><AnswerList questions={props.questions} updateQuestions={props.updateQuestions} multiselect={props.question.multiselect} answers={props.question.answers}/></Show>
    </div>
  );
};

const AnswerList = (props: {answers: RawServerWelcomeAnswer[], multiselect: boolean, questions: RawServerWelcomeQuestion[], updateQuestions: SetStoreFunction<RawServerWelcomeQuestion[]>}) => {
  return (
    <div class={styles.answerList}>
      <For each={props.answers.toSorted((a, b) => a.order - b.order)}>
        {(answer) => <AnswerItem questions={props.questions} answer={answer} multiselect={props.multiselect} updateQuestions={props.updateQuestions} />}
      </For>
    </div>
  );
};

const AnswerItem = (props: {answer: RawServerWelcomeAnswer, questions: RawServerWelcomeQuestion[], multiselect: boolean, updateQuestions: SetStoreFunction<RawServerWelcomeQuestion[]>}) => {
  const params = useParams<{serverId: string}>();
  const onChange = async (newVal: boolean) => {
    if (newVal) {
      await addAnswerToMember(params.serverId, props.answer.id);
      if (!props.multiselect) {

        const index = props.questions.findIndex(q => q.id === props.answer.questionId);

        if (index === -1) return;

        const answers = props.questions[index]?.answers!;


        batch(() => {
          for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            props.updateQuestions(index, "answers", i, "answered", answer?.id === props.answer.id);
          }
        });
      }
    }
    else {
      await removeAnswerFromMember(params.serverId, props.answer.id);
      if (!props.multiselect) {

        const index = props.questions.findIndex(q => q.id === props.answer.questionId);

        if (index === -1) return;

        const answers = props.questions[index]?.answers!;

        batch(() => {
          for (let i = 0; i < answers.length; i++) {
            props.updateQuestions(index, "answers", i, "answered", false);
          }
        });
      }
    }
  };
  return (
    <div class={styles.answerItem}>
      <Show when={!props.multiselect}><RadioBoxItem onClick={() => onChange(!props.answer.answered)} selected={props.answer.answered} item={{label: props.answer.title, id: props.answer.id}} labelSize={14} class={styles.radioBox} /></Show>
      <Show when={props.multiselect}><Checkbox onChange={onChange} checked={props.answer.answered} labelSize={14} label={props.answer.title} class={styles.checkbox} /></Show>
      <Show when={props.answer._count.answeredUsers}><UserCount count={props.answer._count.answeredUsers}/></Show>
    </div>
  );
};

const UserCount = (props: {count: number}) => {
  return (
    <div class={styles.userCount}>
      <Icon name="person" size={14} />
      <div>{props.count.toLocaleString()}</div>
    </div>
  );
};


const ContinueFooter = () => {
  const params = useParams<{serverId: string}>();
  const store = useStore();

  const server = () => store.servers.get(params.serverId!);
  const defaultChannel = () => store.channels.get(server()?.defaultChannelId);

  return (
    <CustomLink href={RouterEndpoints.SERVER_MESSAGES(params.serverId!, defaultChannel()?.id!)} class={styles.continueFooter}>
      <Button margin={0} class={styles.button} label={`Continue To #${defaultChannel()?.name}`} color="white" customChildren={<Icon name="keyboard_arrow_right" size={24} />} />
    </CustomLink>
  );
};
