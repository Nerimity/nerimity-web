import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";
import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "i18next";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { Notice } from "../ui/Notice/Notice";
import {
  electronWindowAPI,
  Program,
  ProgramWithExtras,
} from "@/common/Electron";
import Button from "../ui/Button";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";
import Block from "../ui/settings-block/Block";
import {
  getStorageObject,
  StorageKeys,
  useReactiveLocalStorage,
} from "@/common/localStorage";
import { emitActivityStatus } from "@/chat-api/emits/userEmits";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import Input from "../ui/input/Input";
import { UserActivity } from "../floating-profile/FloatingProfile";
import { CustomLink } from "../ui/CustomLink";
import Icon from "../ui/icon/Icon";
import { EmojiPicker } from "../ui/emoji-picker/EmojiPicker";
import { Modal } from "../ui/modal";
import { emojiShortcodeToUnicode } from "@/emoji";
import { emojiToUrl } from "@/common/emojiToUrl";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  flex-shrink: 0;
`;

const Options = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 10px;
  flex-shrink: 0;
`;

const BlockContent = styled("div")`
  position: absolute;
  inset: 0;
  z-index: 1111;
  cursor: not-allowed;
`;

const RPCAdContainer = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 10px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 10px;

  margin-bottom: 16px;
`;

const ExampleActivityContainer = styled("div")`
  padding: 2px;
  background: rgba(255, 255, 255, 0.04);
  flex: 1;
  border-radius: 8px;
  padding-left: 6px;
  padding-right: 6px;
  min-width: 250px;
  .activityImage {
    background: rgba(0, 0, 0, 0.2);
  }
`;

export default function WindowSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.activity.title"),
      iconName: "settings",
    });
  });

  const isElectron = electronWindowAPI()?.isElectron;

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.activity-status")!} />
      </Breadcrumb>

      <RPCAdContainer>
        <FlexRow gap={12} itemsCenter>
          <Icon name="extension" />
          <FlexColumn gap={4}>
            <Text size={14}>{t("settings.activity.rpc.title")}</Text>
            <Text size={12} opacity={0.6}>
              {t("settings.activity.rpc.description")}
            </Text>
          </FlexColumn>
        </FlexRow>

        <FlexRow
          gap={6}
          itemsCenter
          justifyCenter
          wrap
          class={css`
            margin-top: 6px;
          `}
        >
          <ExampleActivityContainer>
            <UserActivity
              exampleActivity={{
                action: t("settings.activity.rpc.watching"),
                name: "YouTube",
                startedAt: Date.now() - 3000,
                endsAt: Date.now() + 10000,
                imgSrc: "https://nerimity.com/assets/logo.png",
                link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                title: t("settings.activity.rpc.videoTitle", { appName: "Nerimity" }),
                subtitle: t("settings.activity.rpc.videoAuthor"),
              }}
            />
          </ExampleActivityContainer>

          <ExampleActivityContainer>
            <UserActivity
              exampleActivity={{
                action: t("settings.activity.rpc.listening"),
                name: "Spotify",
                startedAt: Date.now() - 30000,
                endsAt: Date.now() + 100000,
                imgSrc: "https://nerimity.com/assets/logo.png",
                link: "https://open.spotify.com/track/4PTG3Z6ehGkBFwjybzWkR8?si=2fd41c64b0ad4d3b",
                title: t("settings.activity.rpc.songTitle"),
                subtitle: t("settings.activity.rpc.songAuthor"),
              }}
            />
          </ExampleActivityContainer>
        </FlexRow>

        <FlexRow
          class={css`
            align-self: flex-end;
          `}
          gap={6}
          wrap
        >
          <CustomLink
            target="_blank"
            rel="noopener noreferrer"
            href="https://addons.mozilla.org/en-GB/firefox/addon/nerimity-rpc"
          >
            <Button
              margin={[10, 0, 0, 0]}
              iconName="extension"
              primary
              label={t("settings.activity.rpc.visit", { store: "Firefox Add-ons" })}
            />
          </CustomLink>
          <CustomLink
            target="_blank"
            rel="noopener noreferrer"
            href="https://chromewebstore.google.com/detail/nerimity-rpc/lgboikjogeocndkamelapkbngmfjfgaf"
          >
            <Button
              margin={[10, 0, 0, 0]}
              iconName="extension"
              primary
              label={t("settings.activity.rpc.visit", { store: "Chrome Web Store" })}
            />
          </CustomLink>
        </FlexRow>
      </RPCAdContainer>

      <Show when={!isElectron}>
        <Notice
          type="info"
          description={t("settings.downloadAppNotice")}
        />
      </Show>

      <Options>
        <Show when={!isElectron}>
          <BlockContent />
        </Show>
        <ProgramOptions />
      </Options>
    </Container>
  );
}

function ProgramOptions() {
  const [programs, setPrograms] = createSignal<Program[]>([]);
  const [addedPrograms, setAddedPrograms] = useReactiveLocalStorage<
    ProgramWithExtras[]
  >(StorageKeys.PROGRAM_ACTIVITY_STATUS, []);

  const { createPortal } = useCustomPortal();

  const getPrograms = () => {
    electronWindowAPI()?.getRunningPrograms(addedPrograms()).then(setPrograms);
  };

  const restartActivityStatus = () => {
    electronWindowAPI()?.restartActivityStatus(addedPrograms());
  };

  const updateProgram = (index: number, program: ProgramWithExtras) => {
    const programs = [...addedPrograms()];
    programs[index] = program;
    setAddedPrograms(programs);
    restartActivityStatus();
  };

  const showEditModal = (i: number, program: ProgramWithExtras) => {
    createPortal((close) => (
      <EditActivityStatusModal
        onEdit={(p) => updateProgram(i, p)}
        program={program}
        close={close}
      />
    ));
  };

  onMount(() => {
    if (!electronWindowAPI()?.isElectron) return;
    getPrograms();
    const timerId = window.setInterval(() => {
      getPrograms();
    }, 3000);

    onCleanup(() => {
      window.clearInterval(timerId);
    });
  });
  const dropDownItems = () => {
    return programs().map((program) => ({
      id: program.filename,
      label: program.name,
      description: program.filename,
      data: program,
    })) satisfies DropDownItem[];
  };

  const addProgram = (item: DropDownItem) => {
    const program = {
      ...item.data,
      action: t("settings.activity.playing"),
    };
    setAddedPrograms([...addedPrograms(), program]);
    getPrograms();
    restartActivityStatus();
  };

  const removeProgram = (program: Program) => {
    setAddedPrograms(addedPrograms().filter((p) => p !== program));
    getPrograms();
    restartActivityStatus();
  };

  const emojiUrl = (emoji?: string) => {
    if (!emoji) return undefined;
    return emojiToUrl(emoji, false);
  };

  return (
    <FlexColumn>
      <SettingsBlock
        icon="games"
        label={t("settings.activity.title")}
        description={t("settings.activity.description")}
        header={!!addedPrograms().length}
      >
        <Show when={addedPrograms().length + 1} keyed>
          <DropDown
            onChange={addProgram}
            items={dropDownItems()}
            class={css`
              width: 200px;
            `}
          />
        </Show>
      </SettingsBlock>

      <For each={addedPrograms()}>
        {(item, i) => (
          <Block
            borderTopRadius={false}
            borderBottomRadius={i() === addedPrograms().length - 1}
          >
            <FlexRow
              gap={12}
              class={css`
                flex: 1;
                align-items: center;
              `}
            >
              <Show when={emojiUrl(item.emoji)}>
                {(emojiUrl) => (
                  <img
                    style={{ "object-fit": "contain" }}
                    src={emojiUrl()}
                    height={40}
                    width={40}
                  />
                )}
              </Show>
              <FlexColumn
                gap={4}
                class={css`
                  flex: 1;
                `}
              >
                <FlexRow gap={5} itemsCenter>
                  <Text bold>{item.action}</Text>
                  <Text opacity={0.8}>{item.name}</Text>
                </FlexRow>
                <Text opacity={0.6} size={14}>
                  {item.filename}
                </Text>
              </FlexColumn>
              <FlexRow>
                <Button
                  iconName="delete"
                  onClick={() => removeProgram(item)}
                  label={t("settings.activity.deleteButton")}
                  color="var(--alert-color)"
                />
                <Button
                  iconName="edit"
                  label={t("settings.activity.editButton")}
                  onClick={() => showEditModal(i(), item)}
                />
              </FlexRow>
            </FlexRow>
          </Block>
        )}
      </For>
    </FlexColumn>
  );
}

const EditActivityStatusModal = (props: {
  onEdit(newProgram: ProgramWithExtras): void;
  program: ProgramWithExtras;
  close: () => void;
}) => {
  const [newValues, setValues] = createSignal(props.program);

  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);
  const store = useStore();

  const emojiPicked = (shortcode: string) => {
    const customEmoji = store.servers.customEmojiNamesToEmoji()[shortcode];
    const unicode = emojiShortcodeToUnicode(shortcode);
    const icon =
      unicode || `${customEmoji.id}.${customEmoji.gif ? "gif" : "webp"}`;

    setValues({ ...newValues(), emoji: icon });
    setShowEmojiPicker(false);
  };

  const emojiUrl = createMemo(() => {
    if (!newValues().emoji) return undefined;
    return emojiToUrl(newValues().emoji!, false);
  });

  return (
    <Modal.Root close={props.close}>
      <Modal.Header title={t("settings.activity.editStatus")} icon="edit" />
      <Modal.Body
        class={css`
          overflow: auto;
          min-width: 420px;
        `}
      >
        <FlexColumn padding={6} gap={6}>
          <Input
            label={t("settings.activity.executable")}
            value={newValues().filename}
            onText={(v) => setValues({ ...newValues(), filename: v })}
          />
          <Input
            label={t("settings.activity.action")}
            value={newValues().action}
            onText={(v) => setValues({ ...newValues(), action: v })}
          />
          <Input
            label={t("settings.activity.name")}
            value={newValues().name}
            onText={(v) => setValues({ ...newValues(), name: v })}
          />
          <div>
            <SettingsBlock
              header={showEmojiPicker()}
              label={t("settings.activity.emoji")}
              icon={emojiUrl() ? undefined : "face"}
              iconSrc={emojiUrl()}
              onClick={() => setShowEmojiPicker(!showEmojiPicker())}
              onClickIcon="keyboard_arrow_down"
            />
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                "margin-top": "-1px",
              }}
            >
              <Show when={showEmojiPicker()}>
                <EmojiPicker close={() => {}} onClick={emojiPicked} />
              </Show>
            </div>
          </div>
        </FlexColumn>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("settings.activity.backButton")}
          onClick={props.close}
          iconName="close"
          alert
        />
        <Modal.Button
          label={t("settings.activity.saveButton")}
          onClick={() => {
            props.onEdit(newValues());
            props.close();
          }}
          iconName="edit"
          primary
        />
      </Modal.Footer>
    </Modal.Root>
  );
};
