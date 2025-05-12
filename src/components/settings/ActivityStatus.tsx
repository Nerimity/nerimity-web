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
  getStorageString,
  setStorageString,
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
import { useDiscordActivityTracker } from "@/common/useDiscordActivityTracker";

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

  margin-bottom: 6px;
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
      title: "Settings - Activity Status",
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
            <Text size={14}>Chrome Extension</Text>
            <Text size={12} opacity={0.6}>
              Our RPC extension allows you to share your activity from Spotify
              and YouTube with users on Nerimity!
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
                action: "Watching",
                name: "YouTube",
                startedAt: Date.now() - 3000,
                endsAt: Date.now() + 10000,
                imgSrc: "https://nerimity.com/assets/logo.png",
                link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                title: "Why Nerimity is the best",
                subtitle: "Good YouTuber",
              }}
            />
          </ExampleActivityContainer>

          <ExampleActivityContainer>
            <UserActivity
              exampleActivity={{
                action: "Listening to",
                name: "Spotify",
                startedAt: Date.now() - 30000,
                endsAt: Date.now() + 100000,
                imgSrc: "https://nerimity.com/assets/logo.png",
                link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                title: "Ner Ner Nerimity!",
                subtitle: "Nerimity",
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
              label="Visit Firefox Add-ons"
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
              label="Visit Chrome Web Store"
            />
          </CustomLink>
        </FlexRow>
      </RPCAdContainer>
      <DiscordActivity />

      <Show when={!isElectron}>
        <Notice
          type="info"
          description="To modify these settings, you must download the Nerimity desktop app."
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
      action: "Playing",
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
        label="Activity Status"
        description="Share what you're up to with everyone."
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
                  label="Delete"
                  color="var(--alert-color)"
                />
                <Button
                  iconName="edit"
                  label="Edit"
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
      <Modal.Header title="Edit Activity Status" icon="edit" />
      <Modal.Body
        class={css`
          overflow: auto;
          min-width: 420px;
        `}
      >
        <FlexColumn padding={6} gap={6}>
          <Input
            label="Executable"
            value={newValues().filename}
            onText={(v) => setValues({ ...newValues(), filename: v })}
          />
          <Input
            label="Action"
            value={newValues().action}
            onText={(v) => setValues({ ...newValues(), action: v })}
          />
          <Input
            label="Name"
            value={newValues().name}
            onText={(v) => setValues({ ...newValues(), name: v })}
          />
          <div>
            <SettingsBlock
              header={showEmojiPicker()}
              label="Emoji"
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
          label="Back"
          onClick={props.close}
          iconName="close"
          alert
        />
        <Modal.Button
          label="Save"
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

const DiscordActivity = () => {
  const { createPortal } = useCustomPortal();
  const discordActivityTracker = useDiscordActivityTracker();
  const [userId, setUserId] = createSignal<string>(
    getStorageString(StorageKeys.DISCORD_USER_ID, "")
  );

  const onBlur = () => {
    const id = userId()?.trim();
    if (!id) {
      setStorageString(StorageKeys.DISCORD_USER_ID, "");
      discordActivityTracker.restart();
      return;
    }
    createPortal((close) => {
      const onCloseClick = () => {
        setStorageString(StorageKeys.DISCORD_USER_ID, "");
        setUserId("");
        discordActivityTracker.restart();
        close();
      };
      const onJoinedClick = () => {
        setStorageString(StorageKeys.DISCORD_USER_ID, id);
        setUserId(id);
        discordActivityTracker.restart();
        close();
      };
      return (
        <DiscordServerJoinedConfirmModal
          close={onCloseClick}
          onJoinedClick={onJoinedClick}
        />
      );
    });
  };
  return (
    <SettingsBlock
      label="Discord Activity"
      description="Share your Discord activity with users on Nerimity!"
    >
      <Input
        placeholder="Discord User Id"
        onText={setUserId}
        value={userId()}
        onBlur={onBlur}
      />
    </SettingsBlock>
  );
};

const DiscordServerJoinedConfirmModal = (props: {
  close: () => void;
  onJoinedClick: () => void;
}) => {
  return (
    <Modal.Root
      close={props.close}
      doNotCloseOnBackgroundClick
      desktopMaxWidth={500}
    >
      <Modal.Header title="Discord Activity" icon="edit" />
      <Modal.Body>
        <FlexColumn padding={6} gap={6}>
          <Text>
            Please join the Discord server to enable Activity Sharing.
            <div>
              <a target="_blank" href="https://discord.gg/kdArWJ8DU2">
                https://discord.gg/kdArWJ8DU2
              </a>
            </div>
          </Text>
        </FlexColumn>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label="Cancel"
          alert
          onClick={props.close}
          iconName="close"
        />
        <Modal.Button
          label="I have joined"
          onClick={props.onJoinedClick}
          primary
          iconName="check"
        />
      </Modal.Footer>
    </Modal.Root>
  );
};
