
import { addServerEmoji } from "@/chat-api/services/ServerService";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import FileBrowser, { FileBrowserRef, getBase64 } from "@/components/ui/FileBrowser";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { Notice } from "@/components/ui/Notice";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Text from "@/components/ui/Text";
import { useParams } from "@solidjs/router";
import { t } from "i18next";
import { createEffect, createSignal, Match, onMount, Show, Switch } from "solid-js";
import { styled } from "solid-styled-components";

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
  const { servers, header } = useStore();
  const [fileBrowser, setFileBrowser] = createSignal<FileBrowserRef | undefined>(undefined);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Emojis",
      serverId: params.serverId!,
      iconName: 'settings',
    });
  })

  const server = () => servers.get(params.serverId);

  const onFilePick = async (files: FileList) => {
    const file = files[0];
    const base64Image = await getBase64(file);
    const name = file.name.split(".")[0]
    addServerEmoji(params.serverId, name, base64Image!)
  }


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(params.serverId, server()?.defaultChannelId!)} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t('servers.settings.drawer.emojis')} />
      </Breadcrumb>


        <Text size={24} style={{ "margin-bottom": "10px" }}>Emojis</Text>
        <SettingsBlock icon="face" label="Custom Emojis" description="Add your own emojis!">
          <FileBrowser accept="images" ref={setFileBrowser} onChange={onFilePick} />
          <Button label="Add Emoji" onClick={() => fileBrowser()?.open()} />
        </SettingsBlock>


    </Container>
  )
}
