import styles from "./styles.module.scss";

import { useParams } from "solid-navigator";
import { For, Setter, Show, createEffect, createSignal, on, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { addAnswerToMember, getWelcomeQuestions, removeAnswerFromMember } from "@/chat-api/services/ServerService";
import { RawServerWelcomeAnswer, RawServerWelcomeQuestion } from "@/chat-api/RawData";
import Checkbox from "@/components/ui/Checkbox";
import Icon from "@/components/ui/icon/Icon";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import { CustomLink } from "@/components/ui/CustomLink";
import RouterEndpoints from "@/common/RouterEndpoints";

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
    <>
      <div class={styles.pane}>  
        <WelcomeMessage/>
        <QuestionList questions={questions()} updateQuestions={setQuestions} />
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
      <Text size={24}>{server()?.name}</Text>
      <Text size={16} opacity={0.6}>Complete these questions:</Text>
    </div>
  );
};

const QuestionList = (props: {questions: RawServerWelcomeQuestion[], updateQuestions: Setter<RawServerWelcomeQuestion[]>}) => {
  return (
    <div class={styles.questionList}>
      <For each={props.questions.sort((a, b) => a.order - b.order)}>
        {(question) => <QuestionItem question={question} updateQuestions={props.updateQuestions} />}
      </For>
    </div>
  );
};

const QuestionItem = (props: {question: RawServerWelcomeQuestion; updateQuestions: Setter<RawServerWelcomeQuestion[]>}) => {
  return (
    <div class={styles.questionItem}>
      <div>{props.question.title}</div>
      <Show when={props.question.answers.length}><AnswerList updateQuestions={props.updateQuestions} multiselect={props.question.multiselect} answers={props.question.answers}/></Show>
    </div>
  );
};

const AnswerList = (props: {answers: RawServerWelcomeAnswer[], multiselect: boolean, updateQuestions: Setter<RawServerWelcomeQuestion[]>}) => {
  return (
    <div class={styles.answerList}>
      <For each={props.answers.sort((a, b) => a.order - b.order)}>
        {(answer) => <AnswerItem answer={answer} multiselect={props.multiselect} updateQuestions={props.updateQuestions} />}
      </For>
    </div>
  );
};

const AnswerItem = (props: {answer: RawServerWelcomeAnswer, multiselect: boolean, updateQuestions: Setter<RawServerWelcomeQuestion[]>}) => {
  const params = useParams<{serverId: string}>();
  const onChange = async (newVal: boolean) => {
    if (newVal) {
      await addAnswerToMember(params.serverId, props.answer.id);
      if (!props.multiselect) {
        props.updateQuestions(prev => {
          
          return prev.map(q => {
            if (q.id !== props.answer.questionId) {
              return q;
            }
            return {
              ...q,
              answers: q.answers.map(a => ({
                ...a,
                answered: a.id === props.answer.id
              }))
            };
          });
        });
      }
    }
    else {
      await removeAnswerFromMember(params.serverId, props.answer.id);
      if (!props.multiselect) {
        props.updateQuestions(prev => {
          
          return prev.map(q => {
            if (q.id !== props.answer.questionId) {
              return q;
            }
            return {
              ...q,
              answers: q.answers.map(a => ({
                ...a,
                answered: false
              }))
            };
          });
        });
      }
    }
  };
  return (
    <div class={styles.answerItem}>
      <Checkbox onChange={onChange} checked={props.answer.answered} labelSize={14} label={props.answer.title} class={styles.checkbox} />
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
