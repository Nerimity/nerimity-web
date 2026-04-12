import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { useTransContext } from "@nerimity/solid-i18lite";
import { useParams } from "solid-navigator";
import { createEffect, createSignal, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import { emojiShortcodeToUnicode } from "@/emoji";
import { Emoji } from "@/components/ui/Emoji";
import { FloatingSaveChanges } from "@/components/ui/FloatingSaveChanges";
import Input from "@/components/ui/input/Input";
import { deleteClan, updateClan } from "@/chat-api/services/ServerService";
import Checkbox from "@/components/ui/Checkbox";
import MessageItem from "@/components/message-pane/message-item/MessageItem";
import { MessageType, RawServerClan, RawUser } from "@/chat-api/RawData";
import { Notice } from "@/components/ui/Notice/Notice";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const buttonStyle = css`
  align-self: flex-end;
`;

export default function ClanTagServerSettings() {
  const [t] = useTransContext();
  const params = useParams<{ serverId: string }>();
  const { header, servers, account } = useStore();

  const [error, setError] = createSignal<string | null>(null);
  const [saveRequestSent, setSaveRequestSent] = createSignal(false);

  const server = () => servers.get(params.serverId);

  const [emojiPickerPosition, setEmojiPickerPosition] = createSignal<null | {
    x: number;
    y: number;
  }>(null);

  const defaultInput = () => ({
    enabled: server()?.clan ? true : false,
    tag: server()?.clan?.tag || "",
    icon: server()?.clan?.icon || null
  });

  const [inputValues, updatedInputValues, setInputValue, undoUpdatedValues] =
    createUpdatedSignal(defaultInput);

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") +
        " - " +
        t("servers.settings.drawer.clanTag"),
      serverId: params.serverId!,
      iconName: "settings"
    });
  });

  const openIconPicker = (event: MouseEvent) => {
    setEmojiPickerPosition({
      x: event.clientX,
      y: event.clientY
    });
  };
  const onIconPicked = (shortcode: string) => {
    const customEmoji = servers.customEmojiNamesToEmoji()[shortcode]!;
    const unicode = emojiShortcodeToUnicode(shortcode);

    const ext = () => {
      if (customEmoji.gif && !customEmoji.webp) return ".gif";
      if (customEmoji.webp && customEmoji.gif) return ".webp#a";
      return ".webp";
    };

    const icon = unicode || `${customEmoji.id}${ext()}`;
    setInputValue("icon", icon);
  };

  const onSaveButtonClicked = () => {
    setError(null);
    const icon = inputValues().icon;
    const tag = inputValues().tag.trim();
    if (!icon || !tag) {
      setError("Both tag and icon are required.");
      return;
    }
    if (!inputValues().enabled) {
      deleteClan(params.serverId)
        .then(() => {
          setSaveRequestSent(true);
        })
        .catch((err) => setError(err.message))
        .finally(() => setSaveRequestSent(false));
      return;
    }

    updateClan(params.serverId, tag, icon)
      .then(() => {
        setSaveRequestSent(true);
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaveRequestSent(false));
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem title={t("servers.settings.drawer.clanTag")} />
      </Breadcrumb>

      <Show when={!server()?.verified}>
        <Notice
          class={css`
            margin-bottom: 10px;
          `}
          type="info"
          description={t("servers.settings.clans.verifiedServerOnly")}
        />
      </Show>

      <SettingsBlock
        icon="sell"
        label={t("servers.settings.clans.enableClanTag")}
      >
        <Checkbox
          checked={inputValues().enabled}
          onChange={(v) => setInputValue("enabled", v)}
        />
      </SettingsBlock>

      <div
        class={css`
          margin-top: 10px;
          margin-bottom: 10px;
        `}
      >
        <MessageItem
          message={{
            buttons: [],
            channelId: "",
            createdAt: Date.now(),
            id: "",
            quotedMessages: [],
            reactions: [],
            replyMessages: [],
            roleMentions: [],
            type: MessageType.CONTENT,
            content: "Hello there!",
            createdBy: {
              ...(account.user() as unknown as RawUser),
              profile: {
                ...account.user()?.profile,
                clan: inputValues() as RawServerClan
              }
            }
          }}
        />
      </div>

      <Show when={inputValues().enabled}>
        <SettingsBlock icon="sell" label={t("servers.settings.clans.tag")}>
          <Input
            class={css`
              width: 5em;
            `}
            value={inputValues().tag}
            maxLength={4}
            onText={(v) => setInputValue("tag", v)}
          />
        </SettingsBlock>

        <SettingsBlock icon="face" label={t("servers.settings.clans.icon")}>
          <Button
            iconName={inputValues().icon ? undefined : "face"}
            iconSize={16}
            onClick={openIconPicker}
            customChildren={
              inputValues().icon ? (
                <Emoji size={24} icon={inputValues().icon} />
              ) : undefined
            }
          />
          <Show when={emojiPickerPosition()}>
            <FloatingEmojiPicker
              onClick={onIconPicked}
              serverId={params.serverId}
              {...emojiPickerPosition()!}
              close={() => setEmojiPickerPosition(null)}
            />
          </Show>
        </SettingsBlock>
      </Show>

      <FloatingSaveChanges
        hasChanges={Object.keys(updatedInputValues()).length}
        isSaving={saveRequestSent()}
        onSave={onSaveButtonClicked}
        error={error()}
        onUndo={() => undoUpdatedValues()}
      />
    </Container>
  );
}
