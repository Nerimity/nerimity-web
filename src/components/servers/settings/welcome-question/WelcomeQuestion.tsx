import {
  For,
  Setter,
  Show,
  batch,
  createEffect,
  createSignal,
  onMount,
} from "solid-js";
import styles from "./styles.module.scss";
import {
  getWelcomeQuestion,
  updateWelcomeQuestion,
} from "@/chat-api/services/ServerService";
import { useParams } from "solid-navigator";
import {
  RawServerWelcomeAnswer,
  RawServerWelcomeQuestion,
} from "@/chat-api/RawData";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useTransContext } from "@mbarzda/solid-i18next";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input/Input";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { DropDownItem } from "@/components/ui/drop-down/DropDown";
import MultiSelectDropDown from "@/components/ui/multi-select-drop-down/MultiSelectDropDown";
import Checkbox from "@/components/ui/Checkbox";
import Text from "@/components/ui/Text";
import { ServerRole } from "@/chat-api/store/useServerRoles";

export default function SettingsPage() {
  const [t] = useTransContext();

  const params = useParams<{ serverId: string; questionId: string }>();
  const { header, servers, serverRoles } = useStore();
  const { createPortal } = useCustomPortal();
  const [initialQuestion, setInitialQuestion] =
    createSignal<RawServerWelcomeQuestion | null>(null);
  const [question, setQuestion] = createSignal<RawServerWelcomeQuestion | null>(
    null
  );
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const onSaveClick = async () => {
    const q = question();
    if (!q) return;
    if (saving()) return;
    setSaving(true);
    setError(null);
    const res = await updateWelcomeQuestion(
      params.serverId,
      params.questionId,
      {
        title: q.title,
        answers: q.answers,
        multiselect: q.multiselect,
      }
    ).catch((err) => {
      setError(err.message);
    });

    if (res) {
      batch(() => {
        setInitialQuestion(res);
        setQuestion(res);
      });
    }

    setSaving(false);
  };

  onMount(async () => {
    header.updateHeader({
      title: t("servers.settings.drawer.title") + " - " + t("servers.settings.drawer.self-assign-roles"),
      serverId: params.serverId!,
      iconName: "settings",
    });
    const q = await getWelcomeQuestion(params.serverId, params.questionId);
    batch(() => {
      setQuestion(q);
      setInitialQuestion(q);
    });
  });

  const showSaveButton = () => {
    return JSON.stringify(question()) !== JSON.stringify(initialQuestion());
  };

  const server = () => servers.get(params.serverId);

  const roleList = (answerIndex: number) => {
    const roleIds = question()?.answers[answerIndex]?.roleIds || [];
    const roles = roleIds
      .map((roleId) => serverRoles.get(params.serverId, roleId)!)
      .sort((a, b) => a?.order - b?.order);
    return roles.map((r) => r.name).join(" • ");
  };

  const answers = () =>
    question()?.answers.sort((a, b) => a?.order - b?.order) || [];

  const onEditClick = (answerIndex: number) => {
    const editAnswer = (newAnswer: Partial<RawServerWelcomeAnswer>) => {
      const clonedAnswers = [...answers()];
      clonedAnswers[answerIndex]! = {
        ...clonedAnswers[answerIndex]!,
        ...newAnswer,
      };

      setQuestion({ ...question()!, answers: clonedAnswers });
    };
    createPortal((close) => (
      <EditAnswerModal
        close={close}
        question={question()!}
        answer={question()!.answers[answerIndex]!}
        editAnswer={editAnswer}
      />
    ));
  };

  const addAnswer = () => {
    const q = question();
    if (!q) return;
    setQuestion({
      ...q,
      answers: [
        ...q.answers,
        {
          id: "",
          roleIds: [],
          title: t("servers.settings.selfRoles.untitledAnswer"),
          order: q.answers.length,
        },
      ],
    });
    onEditClick(q.answers.length);
  };

  const onDeleteClick = (answerIndex: number) => {
    const clonedAnswers = [...answers()];
    clonedAnswers.splice(answerIndex, 1);
    setQuestion({ ...question()!, answers: clonedAnswers });
  };

  return (
    <div class={styles.pane}>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId || ""
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem
          title={t("servers.settings.drawer.welcome-screen")}
          href="../"
        />
        <BreadcrumbItem title={question() ? question()?.title : t("servers.settings.selfRoles.loading")} />
      </Breadcrumb>
      <SettingsBlock label={t("servers.settings.selfRoles.question")} icon="edit">
        <Input
          placeholder={t("servers.settings.selfRoles.placeholderQuestion")}
          value={question()?.title}
          onText={(text) => setQuestion({ ...question()!, title: text })}
        />
      </SettingsBlock>

      <SettingsBlock label={t("servers.settings.selfRoles.multiselect")} icon="library_add_check">
        <Checkbox
          checked={!!question()?.multiselect}
          onChange={(checked) =>
            setQuestion({ ...question()!, multiselect: checked })
          }
        />
      </SettingsBlock>

      <SettingsBlock
        label={t("servers.settings.selfRoles.answers")}
        header={!!question()?.answers.length}
        icon="question_answer"
      >
        <Button
          label={t("servers.settings.selfRoles.addAnswerButton")}
          iconName="add"
          iconSize={16}
          margin={0}
          onClick={addAnswer}
        />
      </SettingsBlock>
      <For each={answers()}>
        {(answer, i) => (
          <SettingsBlock
            description={roleList(i())}
            icon="question_answer"
            label={answer.title}
            borderTopRadius={false}
            borderBottomRadius={i() === question()!.answers.length - 1}
          >
            <Button
              label={t("servers.settings.selfRoles.deleteButton")}
              iconName="delete"
              iconSize={16}
              margin={[0, 4]}
              color="var(--alert-color)"
              onClick={() => onDeleteClick(i())}
            />
            <Button
              label={t("servers.settings.selfRoles.editButton")}
              iconName="edit"
              iconSize={16}
              margin={0}
              onClick={() => onEditClick(i())}
            />
          </SettingsBlock>
        )}
      </For>

      <Show when={error()}>
        <Text color="var(--alert-color)">{error()}</Text>
      </Show>
      <Show when={showSaveButton()}>
        <Button label={t("servers.settings.selfRoles.saveChangesButton")} onClick={onSaveClick} iconName="save" />
      </Show>
    </div>
  );
}

const EditAnswerModal = (props: {
  question: RawServerWelcomeQuestion;
  answer: RawServerWelcomeAnswer;
  close: () => void;
  editAnswer: (question: Partial<RawServerWelcomeAnswer>) => void;
}) => {
  const [answerTitle, setAnswerTitle] = createSignal("");
  const [roleIds, setRoleIds] = createSignal<string[]>([]);
  const [t] = useTransContext();

  createEffect(() => {
    setAnswerTitle(props.answer.title);
    setRoleIds(props.answer.roleIds);
  });

  const onEditQuestionClick = async () => {
    props.editAnswer({
      roleIds: roleIds(),
      title: answerTitle(),
    });
    props.close();
  };

  return (
    <LegacyModal
      title={t("servers.settings.selfRoles.editAnswer")}
      close={props.close}
      ignoreBackgroundClick
      actionButtonsArr={[
        {
          iconName: "edit",
          label: t("servers.settings.selfRoles.editAnswer"),
          onClick: onEditQuestionClick,
          primary: true,
        },
      ]}
    >
      <div class={styles.editQuestionContainer}>
        <AnswerForEditModal
          title={props.answer.title}
          roleIds={props.answer.roleIds}
          onRoleIdsChange={setRoleIds}
          onTitleChange={setAnswerTitle}
        />
      </div>
    </LegacyModal>
  );
};

const AnswerForEditModal = (props: {
  title: string;
  roleIds: string[];
  onTitleChange: Setter<string>;
  onRoleIdsChange: Setter<string[]>;
}) => {
  const params = useParams<{ serverId: string }>();
  const store = useStore();
  const [t] = useTransContext();

  const server = () => store.servers.get(params.serverId!);

  const roles = () =>
    store.serverRoles
      .getAllByServerId(params.serverId!)
      .filter((role) => role!.id !== server()?.defaultRoleId)
      .filter((r) => !r?.botRole) as ServerRole[];

  const roleItems = () =>
    roles().map((role) => {
      return {
        id: role.id,
        label: role.name,
      } as DropDownItem;
    });

  return (
    <div class={styles.answerForEditModalContainer}>
      <Input
        class={styles.answerInput}
        label={t("servers.settings.selfRoles.answer")}
        placeholder={t("servers.settings.selfRoles.placeholderAnswer")}
        value={props.title}
        onText={(t) => props.onTitleChange(t)}
      />
      <MultiSelectDropDown
        items={roleItems()}
        selectedIds={props.roleIds}
        onChange={(items) =>
          props.onRoleIdsChange(items.map((item) => item.id))
        }
        title={t("servers.settings.selfRoles.selectRoles")}
      />
    </div>
  );
};
