
import { RawPublicServer } from "@/chat-api/RawData";
import { BumpPublicServer, deletePublicServer, getPublicServer, updatePublicServer } from "@/chat-api/services/ServerService";
import useStore from "@/chat-api/store/useStore";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/input/Input";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { Trans, useTransContext } from "@nerimity/solid-i18next";
import { Link, useParams } from "@nerimity/solid-router";
import { createEffect, createSignal, Show,} from "solid-js";
import { css, styled } from "solid-styled-components";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const buttonStyle = css`
  align-self: flex-end;
`;

export default function PublishServerSettings() {
  const [t] = useTransContext();
  const params = useParams<{serverId: string}>();
  const {header} = useStore();

  const [publicServer, setPublicServer] = createSignal<RawPublicServer | null>(null);
  const [description, setDescription] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [isPublic, setIsPublic] = createSignal(false);


  const MAX_DESCRIPTION_LENGTH = 150;
  createEffect(() => {
    header.updateHeader({
      title: "Settings - Publish Server",
      serverId: params.serverId!,
      iconName: 'settings',
    });
    loadPublicServer();
  })

  const loadPublicServer = () => {
    getPublicServer(params.serverId).then(ps => {
      setPublicServer(ps);
      setDescription(ps.description);
      setIsPublic(true);
    })
  }

  const publish = () => {
    setError(null);
    updatePublicServer(params.serverId, description())
      .then(ps => {
        setPublicServer(ps);
        setDescription(ps.description);
      })
      .catch(err => setError(err.message))
  }

  const deletePublic = () => {
    deletePublicServer(params.serverId)
      .then(() => {
        setPublicServer(null);
        setDescription("");
        setError(null);
      })
  }


  const showPublishButton = () => {
    if (!isPublic()) return false;
    if (!publicServer() && description().length) return true;
    if (publicServer()?.description !== description()) return true;
    return false;
  }

  const bumpClick = () => {
    // 3 hours to milliseconds
    const bumpAfter = 3 * 60 * 60 * 1000;

    const millisecondsSinceLastBump = new Date().getTime() - publicServer()!.bumpedAt;
    const timeLeftMilliseconds = bumpAfter - millisecondsSinceLastBump;
    const timeLeft = new Date(timeLeftMilliseconds);

    if (timeLeftMilliseconds > 0) {
      alert(`You must wait ${timeLeft.getUTCHours()} hours, ${timeLeft.getUTCMinutes()} minutes and ${timeLeft.getUTCSeconds()} seconds to bump this server.`);
      return;
    } 


    BumpPublicServer(publicServer()!.serverId)
      .then(newPublicServer => {
        setPublicServer(newPublicServer);
      })
      .catch((err) => {
        alert(err.message)
      })
  }


  return (
    <Container>
      <Text color="rgba(255,255,255,0.6)" style={{"margin-bottom": "10px"}}>
        <Trans key='servers.settings.publishServer.publishNotice'>
          {data => 
            <>
              Publishing your server will make it be available in the <Link href="/app/explore/servers">{data[1]}</Link> page.
            </>
          }
        </Trans>
      </Text>
      <SettingsBlock icon="public" label={t('servers.settings.publishServer.public')} description={t('servers.settings.publishServer.publicDescription')}>
        <Checkbox checked={isPublic()} onChange={v => setIsPublic(v)}/>
      </SettingsBlock>

      <Show when={isPublic() && publicServer()}>
        <SettingsBlock icon="arrow_upward" label={t('servers.settings.publishServer.bumpServer')} description={t('servers.settings.publishServer.bumpServerDescription')}>
          <Button onClick={bumpClick} class={css`margin-right: 0px;`} label={`Bump (${publicServer()?.bumpCount})`} />
        </SettingsBlock>
      </Show>

      <Show when={isPublic()}>
        <Input value={description()} onText={t => setDescription(t)} type="textarea" height={200} label={`Server Description (${description().length}/${MAX_DESCRIPTION_LENGTH})`} />
      </Show>
      <Show when={error()}><Text color="var(--alert-color)">{error()}</Text></Show>
      <Show when={showPublishButton()}><Button class={buttonStyle} iconName="public" label={t('servers.settings.publishServer.publishServerButton')} onClick={publish} /></Show>
      <Show when={!isPublic() && publicServer()}><Button class={buttonStyle} iconName="delete" color="var(--alert-color)" label={t('servers.settings.publishServer.unpublishServerButton')} onClick={deletePublic} /></Show>
    </Container>
  )
}
