import styles from './styles.module.scss';
import { joinServerByInviteCode, serverDetailsByInviteCode, ServerWithMemberCount } from "@/chat-api/services/ServerService";
import Avatar from "@/components/ui/Avatar";
import Button from '@/components/ui/button/Button';
import Input from '@/components/ui/input/Input';
import Icon from '@/components/ui/icon/Icon';


import RouterEndpoints from '@/common/RouterEndpoints';
import { Link, useNavigate, useParams } from '@nerimity/solid-router';
import { createEffect, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { getStorageString, StorageKeys } from '@/common/localStorage';

export default function ExploreServerPane() {
  const params = useParams();
  const navigate = useNavigate();
  const {header} = useStore();
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

    navigate(newPath);
  }

  createEffect(() => {
    fetchInvite(params.inviteId!);
  })
  
  onMount(() => {
    setError("");
    header.updateHeader({
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
  const {servers} = useStore();
  const navigate = useNavigate();
  let [joinClicked, setJoinClicked] = createSignal(false);
  const {server} = props;


  const cacheServer = () => servers.get(server.id);

  createEffect(() => {
    if (joinClicked() && cacheServer()) {
      navigate(RouterEndpoints.SERVER_MESSAGES(cacheServer()!.id, cacheServer()!.defaultChannelId));
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

  const isLoggedIn = getStorageString(StorageKeys.USER_TOKEN, null);
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
          <Switch>
            <Match when={!isLoggedIn}>
              <Link href={RouterEndpoints.LOGIN(location.pathname)} class={styles.joinButton}>
                <Button iconName='login' label='Login To Join' />
              </Link>
            </Match>
            <Match when={cacheServer()}>
              <Link href={RouterEndpoints.SERVER_MESSAGES(server.id, server.defaultChannelId)} class={styles.joinButton}>
                <Button iconName='login' label='Visit Server' />
              </Link>
            </Match>
            <Match when={!cacheServer()}>
              <Button class={styles.joinButton} iconName='login' label='Join Server' onClick={joinServerClick} color="var(--success-color)" />
            </Match>
          </Switch>
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
      <Button label='Try Again' iconName='refresh' onClick={() => props.onJoinClick?.(inviteCode())} />
    </div>
  );
}