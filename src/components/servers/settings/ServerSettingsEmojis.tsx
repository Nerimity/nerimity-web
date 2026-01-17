import { RawUser } from "@/chat-api/RawData";
import {
  addServerEmoji,
  deleteServerEmoji,
  getServerEmojis,
  RawCustomEmojiWithCreator,
  updateServerEmoji,
} from "@/chat-api/services/ServerService";
import useStore from "@/chat-api/store/useStore";
import { classNames } from "@/common/classNames";
import env from "@/common/env";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Emoji } from "@/components/markup/Emoji";
import Avatar from "@/components/ui/Avatar";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import FileBrowser, { FileBrowserRef } from "@/components/ui/FileBrowser";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Input from "@/components/ui/input/Input";
import { Notice } from "@/components/ui/Notice/Notice";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { useParams } from "solid-navigator";
import { createSign } from "crypto";
import { t } from "@nerimity/i18lite";
import {
  createEffect,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { css, styled } from "solid-styled-components";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const ListContainer = styled(FlexColumn)`
  margin-top: 10px;
`;

export default function ServerSettingsBans() {
  const params = useParams<{ serverId: string }>();
  const { servers, header, account } = useStore();
  const [fileBrowser, setFileBrowser] = createSignal<
    FileBrowserRef | undefined
  >(undefined);

  const [emojis, setEmojis] = createSignal<RawCustomEmojiWithCreator[]>([]);

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") + " - " + t("servers.settings.drawer.emoji"),
      serverId: params.serverId!,
      iconName: "settings",
    });
  });

  const server = () => servers.get(params.serverId);

  const onFilePick = async (files: FileList) => {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const promiseFuncs = Array.from(files).map((file) => {
      return async () => {
        const name = file.name.split(".")[0];
        if (!name) return;
        await addServerEmoji(params.serverId, name.substring(0, 15), file).then(
          (newEmoji) => {
            setEmojis(() => [
              { ...newEmoji, uploadedBy: account.user() as RawUser },
              ...emojis(),
            ]);
          },
        );
        await sleep(800);
      };
    });

    for (let index = 0; index < promiseFuncs.length; index++) {
      await promiseFuncs[index]?.();
    }
  };

  onMount(() => {
    getServerEmojis(params.serverId).then(setEmojis);
  });

  const deleteEmoji = (emoji: RawCustomEmojiWithCreator) => {
    setEmojis(emojis().filter((e) => e !== emoji));
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!,
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem title={t("servers.settings.drawer.emoji")} />
      </Breadcrumb>

      <Text size={24} style={{ "margin-bottom": "10px" }}>
        {t("servers.settings.drawer.emoji")}
      </Text>
      <SettingsBlock
        icon="face"
        label={t("servers.settings.emoji.title")}
        description={t("servers.settings.emoji.description")}
        class={css`
          && {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            margin-bottom: 1px;
          }
        `}
      >
        <FileBrowser
          multiple
          accept="images"
          ref={setFileBrowser}
          onChange={onFilePick}
        />
        <Button
          label={t("servers.settings.emoji.addButton")}
          onClick={() => fileBrowser()?.open()}
        />
      </SettingsBlock>
      <EmojiCountPane
        count={emojis().length}
        serverVerified={server()?.verified}
      />
      <Show when={emojis()?.length}>
        <For each={emojis()!}>
          {(emoji) => <EmojiItem emoji={emoji} onDelete={deleteEmoji(emoji)} />}
        </For>
      </Show>
    </Container>
  );
}

const EmojiCountPaneContainer = styled("div")`
  margin-bottom: 1px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.06);
  padding-left: 10px;
`;

const EmojiCountPane = (props: { count: number; serverVerified?: boolean }) => {
  const maxCount = () => (props.serverVerified ? 200 : 80);
  return (
    <EmojiCountPaneContainer>
      <Text size={13} opacity={0.6}>
        ({props.count}/{maxCount()})
      </Text>
    </EmojiCountPaneContainer>
  );
};

const EmojiItemContainer = styled(FlexRow)`
  align-items: center;

  margin-bottom: 2px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.06);

  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  &:not(:last-child) {
    border-radius: 0;
    margin-bottom: 1px;
  }
`;

const EmojiInput = styled("input")`
  background-color: transparent;
  color: white;
  border: none;
  margin-left: 10px;
  padding: 5px;
  max-width: 110px;
`;

function EmojiItem(props: {
  emoji: RawCustomEmojiWithCreator;
  onDelete(): void;
}) {
  const [name, setName] = createSignal(props.emoji.name);
  const params = useParams<{ serverId: string }>();

  const onBlur = async () => {
    const newName = name().trim();
    if (!newName.length) return setName(props.emoji.name);
    await updateServerEmoji(params.serverId, props.emoji.id, newName);
  };

  const onInput = (event: any) => {
    setName(event.target.value.replace(/[^0-9a-zA-Z]/g, "_"));
  };

  const deleteEmoji = () => {
    deleteServerEmoji(params.serverId, props.emoji.id).then(props.onDelete);
  };

  return (
    <EmojiItemContainer>
      <div class={classNames("markup", "largeEmoji")}>
        <Emoji
          name={props.emoji.name}
          animated={props.emoji.gif}
          url={`${env.NERIMITY_CDN}emojis/${props.emoji.id}${
            props.emoji.gif && !props.emoji.webp ? ".gif" : ".webp"
          }`}
        />
      </div>
      <FlexColumn>
        <EmojiInput
          onblur={onBlur}
          spellcheck="false"
          maxlength={15}
          value={name()}
          onInput={onInput}
        />
        <FlexRow
          gap={5}
          style={{
            "align-items": "center",
            "margin-left": "15px",
            "margin-top": "5px",
          }}
        >
          <Avatar user={props.emoji.uploadedBy} size={15} />
          <Text size={13}>{props.emoji.uploadedBy.username}</Text>
        </FlexRow>
      </FlexColumn>
      <Button
        class={css`
          margin-left: auto;
        `}
        onClick={deleteEmoji}
        padding={5}
        iconSize={16}
        color="var(--alert-color)"
        iconName="delete"
      />
    </EmojiItemContainer>
  );
}
