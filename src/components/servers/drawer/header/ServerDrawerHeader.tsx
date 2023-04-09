import styles from './styles.module.scss';
import Icon from "@/components/ui/icon/Icon";
import { useParams } from '@nerimity/solid-router';
import { createSignal, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import ContextMenuServer from '@/components/servers/context-menu/ContextMenuServer';
import { ServerVerifiedIcon } from '../../ServerVerifiedIcon';
import { DrawerHeader } from '@/components/DrawerHeader';
import { Banner } from '@/components/ui/Banner';
import { bannerUrl } from '@/chat-api/store/useServers';
import { css } from 'solid-styled-components';

const ServerDrawerHeader = () => {
  const params = useParams();
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>();
  const { servers } = useStore();
  const server = () => servers.get(params.serverId!);

  const onClick = (e: any) => {
    setContextPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <DrawerHeader class={css`flex-direction: column; align-items: stretch; height: initial;`}>
      <ContextMenuServer onClose={() => setContextPosition(undefined)} position={contextPosition()} serverId={params.serverId} triggerClassName={styles.showMoreIcon} />
      <Banner brightness={40} maxHeight={35} margin={5} url={bannerUrl(server()!)} hexColor={server()?.hexColor}>
        <div class={styles.headerContainer}>
          <div class={styles.serverName}>{server()?.name}</div>
          <Show when={server()?.verified}><ServerVerifiedIcon /></Show>
          <Icon size={18} name='expand_more' class={styles.showMoreIcon} onClick={onClick} />
        </div>
      </Banner>
    </DrawerHeader>
  )
};

export default ServerDrawerHeader;