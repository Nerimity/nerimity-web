import styles from './styles.module.scss';
import Icon from "../Icon";
import { useParams } from 'solid-app-router';
import { createSignal } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import ContextMenuServer from '../ContextMenuServer';

const ServerDrawerHeader =() => {
  const params = useParams();
  const [contextPosition, setContextPosition] = createSignal<{x: number, y: number} | undefined>();
  const {servers} = useStore();
  const server = () => servers.get(params.serverId!);

  const onClick =(e: any) => {
    setContextPosition({x: e.clientX, y: e.clientY});
  };

  return (
    <div class={styles.header}>
      <ContextMenuServer onClose={() => setContextPosition(undefined)} position={contextPosition()} serverId={params.serverId} triggerClassName={styles.showMoreIcon} />
      <div>{server()?.name}</div>
      <Icon size={18} name='expand_more' class={styles.showMoreIcon} onClick={onClick}  />
    </div>
  )
};

export default ServerDrawerHeader;