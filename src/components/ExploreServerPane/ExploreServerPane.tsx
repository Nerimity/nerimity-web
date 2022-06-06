import styles from './styles.module.scss';
import { joinServerByInviteCode, serverDetailsByInviteCode, ServerWithMemberCount } from "../../chat-api/services/ServerService";
import Avatar from "../Avatar/Avatar";
import CustomButton from '../CustomButton/CustomButton';
import Input from '../CustomInput/CustomInput';
import { Icon } from '../Icon/Icon';


import RouterEndpoints from '../../common/RouterEndpoints';
import { Link, useNavigate, useParams } from 'solid-app-router';
import { createEffect, createSignal, onMount, Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';

export default function ExploreServerPane() {
  const params = useParams();
  const navigate = useNavigate();
  const {tabs} = useStore();
  const [server, setServer] = createSignal<ServerWithMemberCount | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const fetchInvite = async (code: string) => {
    setError(null);
    const fetchedServer = await serverDetailsByInviteCode(code).catch(err => {
      setError(err.message);
    });
    setServer(fetchedServer || null);
  }

  const errorJoinClick = (newCode: string) => {
    if (!newCode) return;
    let newPath = RouterEndpoints.EXPLORE_SERVER_INVITE(newCode);
    tabs.updateTab(RouterEndpoints.EXPLORE_SERVER_INVITE(params.inviteId!), {
      path: newPath
    })
    navigate(newPath);
  }

  createEffect(() => {
    fetchInvite(params.inviteId!);
  })
  
  onMount(() => {
    setError("");
    tabs.openTab({
      path: RouterEndpoints.EXPLORE_SERVER_INVITE(params.inviteId!),
      title: "Explore",
      subName: "Join Server",
      iconName: 'explore',
    })

  })



  return (
    <>
    {!!error() && <InvalidServerPage inviteId={params.inviteId} message={error()!}  onJoinClick={errorJoinClick}/>}
    {!error() && !server() && <div>Loading...</div>}
    {(!error() && server()) && <ServerPage server={server()!} inviteCode={params.inviteId}  />}
    </>
  );

}


const ServerPage = (props: {server: ServerWithMemberCount, inviteCode?: string}) => {
  const navigate = useNavigate();
  const {servers} = useStore();
  let [joinClicked, setJoinClicked] = createSignal(false);
  const {server} = props;


  const cacheServer = () => servers.get(server._id);

  createEffect(() => {
    if (joinClicked() && cacheServer()) {
      navigate(RouterEndpoints.SERVER_MESSAGES(cacheServer()._id, cacheServer().defaultChannel));
    }
  })
  
  const joinServerClick = () => {
    if (joinClicked()) return;
    if (!props.inviteCode) return;
    setJoinClicked(true);
    joinServerByInviteCode(props.inviteCode).catch((err) => {
      alert(err.message)
    })
  }

  return (
    <div>
      <div class={styles.topArea}>
        <div class={styles.banner}></div>
        <div class={styles.bannerFloatingItems}>
          {server && <Avatar hexColor={server.hexColor} size={90} />}
          <div class={styles.details}>
            <div class={styles.name}>{server.name}</div>
            <div class={styles.memberCount}>{server.memberCount} members</div>
          </div>
          {!cacheServer() && <CustomButton class={styles.joinButton} iconName='login' label='Join Server' onClick={joinServerClick} color="var(--success-color)" />}
          {cacheServer() && (
            <Link href={RouterEndpoints.SERVER_MESSAGES(server._id, server.defaultChannel)} class={styles.joinButton}>
              <CustomButton iconName='login' label='Visit Server' />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};



function InvalidServerPage (props: {message: string, inviteId?: string, onJoinClick?: (newCode: string) => void}) {
  const [inviteCode, setInviteCode] = createSignal<string>(props.inviteId || "");

  return (
    <div class={styles.invalidServerPage}>
      <Icon name='error' color='var(--alert-color)' size={80} />
      <div class={styles.errorMessage}>{props.message}</div>
      <div class={styles.message}>Please try again later.</div>
      <Input label='Invite Code'  value={inviteCode()} onText={setInviteCode}  />
      <CustomButton label='Try Again' iconName='refresh' onClick={() => props.onJoinClick?.(inviteCode())} />
    </div>
  );
}