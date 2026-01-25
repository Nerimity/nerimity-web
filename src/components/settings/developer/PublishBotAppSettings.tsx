import { RawExploreItem } from "@/chat-api/RawData";
import {
  deleteExploreItem,
  getPublicServer,
  updatePublicServer,
} from "@/chat-api/services/ServerService";
import useStore from "@/chat-api/store/useStore";
import { ServerBumpModal } from "@/components/explore/ExploreServers";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import {
  toast,
  useCustomPortal,
} from "@/components/ui/custom-portal/CustomPortal";
import Input from "@/components/ui/input/Input";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { Trans, useTransContext } from "@nerimity/solid-i18lite";
import { A, useParams } from "solid-navigator";
import { createEffect, createSignal, Show } from "solid-js";
import { css, styled } from "solid-styled-components";
import {
  getExploreBotApp,
  upsertExploreBotApp,
} from "@/chat-api/services/ExploreService";
import { ApplicationBotCreateLinkBlock } from "./ApplicationBotCreateLinkBlock";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ToastModal } from "@/components/ui/toasts/ToastModal";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const buttonStyle = css`
  align-self: flex-end;
`;

export default function PublishBotAppSettings() {
  const [t] = useTransContext();
  const params = useParams<{ id: string }>();

  const [publicItem, setPublicItem] = createSignal<RawExploreItem | null>(null);
  const [description, setDescription] = createSignal("");
  const [permissions, setPermissions] = createSignal(
    ROLE_PERMISSIONS.SEND_MESSAGE.bit
  );
  const [error, setError] = createSignal<string | null>(null);
  const [isPublic, setIsPublic] = createSignal(false);
  const { createPortal } = useCustomPortal();

  const MAX_DESCRIPTION_LENGTH = 150;
  createEffect(() => {
    loadPublicBot();
  });

  const loadPublicBot = () => {
    getExploreBotApp(params.id).then((ps) => {
      setPublicItem(ps);
      setDescription(ps.description);
      setIsPublic(true);
      setPermissions(ps.botPermissions ?? ROLE_PERMISSIONS.SEND_MESSAGE.bit);
    });
  };

  const publish = () => {
    setError(null);
    upsertExploreBotApp(params.id, description(), permissions())
      .then((ps) => {
        setPublicItem(ps);
        setDescription(ps.description);
      })
      .catch((err) => setError(err.message));
  };

  const deletePublic = () => {
    deleteExploreItem(publicItem()?.id!).then(() => {
      setPublicItem(null);
      setDescription("");
      setError(null);
      setPermissions(ROLE_PERMISSIONS.SEND_MESSAGE.bit);
    });
  };

  const showPublishButton = () => {
    if (!isPublic()) return false;
    if (!publicItem() && description().length) return true;
    if (publicItem()?.description !== description()) return true;
    if (permissions() != publicItem()?.botPermissions) return true;
    return false;
  };

  const bumpClick = () => {
    const bumpAfter = 3 * 60 * 60 * 1000; // 3 hours in ms

    const millisecondsSinceLastBump =
      new Date().getTime() - publicItem()!.bumpedAt;
    const timeLeftMilliseconds = bumpAfter - millisecondsSinceLastBump;
    const timeLeft = new Date(timeLeftMilliseconds);

    if (timeLeftMilliseconds > 0) {
      toast(
        t("settings.developer.bot.bumpBotCooldown", {
          hours: timeLeft.getUTCHours(),
          minutes: timeLeft.getUTCMinutes(),
          seconds: timeLeft.getUTCSeconds(),
        }),
        t("settings.developer.bot.bumpBot"),
        "arrow_upward"
      );
    }

    return createPortal((close) => (
      <ServerBumpModal
        update={setPublicItem}
        publicServer={publicItem()!}
        close={close}
      />
    ));
  };

  return (
    <Container>
      <Text color="rgba(255,255,255,0.6)" style={{ "margin-bottom": "10px" }}>
        <Trans key="settings.developer.bot.publishNotice">
          Publishing your bot will make it be available in the
          <A href="/app/explore/servers">explore</A> page.
        </Trans>
      </Text>
      <SettingsBlock
        icon="public"
        label={t("servers.settings.publishServer.public")}
        description={t("settings.developer.bot.publicDescription")}
      >
        <Checkbox checked={isPublic()} onChange={(v) => setIsPublic(v)} />
      </SettingsBlock>

      <Show when={isPublic() && publicItem()}>
        <SettingsBlock
          icon="arrow_upward"
          label={t("settings.developer.bot.bumpBot")}
          description={t("settings.developer.bot.bumpBotDescription")}
        >
          <Button
            onClick={bumpClick}
            class={css`
              margin-right: 0px;
            `}
            label={t("servers.settings.publishServer.bumpButton", {
              count: publicItem()?.bumpCount,
            })}
          />
        </SettingsBlock>
      </Show>

      <Show when={isPublic()}>
        <Input
          value={description()}
          onText={(t) => setDescription(t)}
          type="textarea"
          height={200}
          label={t("settings.developer.bot.botDescription", {
            current: description().length,
            max: MAX_DESCRIPTION_LENGTH,
          })}
        />
        <ApplicationBotCreateLinkBlock
          value={permissions()}
          onChange={setPermissions}
          hideUrlBar
        />
      </Show>
      <Show when={error()}>
        <Text color="var(--alert-color)">{error()}</Text>
      </Show>
      <Show when={showPublishButton()}>
        <Button
          class={buttonStyle}
          iconName="public"
          label={t("servers.settings.publishServer.publishServerButton")}
          onClick={publish}
        />
      </Show>
      <Show when={!isPublic() && publicItem()}>
        <Button
          class={buttonStyle}
          iconName="delete"
          color="var(--alert-color)"
          label={t("servers.settings.publishServer.unpublishServerButton")}
          onClick={deletePublic}
        />
      </Show>
    </Container>
  );
}
