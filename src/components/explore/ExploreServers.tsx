import { RawPublicServer } from '@/chat-api/RawData';
import { BumpPublicServer, getPublicServers, joinPublicServer } from '@/chat-api/services/ServerService';
import { avatarUrl, bannerUrl } from '@/chat-api/store/useServers';
import useStore from '@/chat-api/store/useStore';
import RouterEndpoints from '@/common/RouterEndpoints';
import { useTransContext } from '@mbarzda/solid-i18next';
import { Link, useNavigate } from '@solidjs/router';
import { update } from 'idb-keyval';
import { createSignal, For, Show } from 'solid-js';
import { createEffect } from 'solid-js';
import { css, styled } from 'solid-styled-components';
import { ServerVerifiedIcon } from '../servers/ServerVerifiedIcon';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import DropDown, { DropDownItem } from '../ui/drop-down/DropDown';
import { FlexColumn, FlexRow } from '../ui/Flexbox';
import Icon from '../ui/icon/Icon';
import { Notice } from '../ui/Notice/Notice';
import Text from '../ui/Text';
import { Banner } from '../ui/Banner';
import { timeSince } from '@/common/date';
import { useCustomPortal } from '../ui/custom-portal/CustomPortal';
import Modal from '../ui/modal/Modal';
import { Turnstile, TurnstileRef } from '@nerimity/solid-turnstile';
import env from '@/common/env';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

const GridLayout = styled("div")`
  display: grid;
  grid-gap: 16px;
  grid-template-columns: repeat(auto-fill,minmax(248px,1fr));
`;

export default function ExploreServers() {
  const [t] = useTransContext();
  const { header } = useStore();
  const [publicServers, setPublicServers] = createSignal<null | RawPublicServer[]>(null);
  const [query, setQuery] = createSignal({ sort: 'most_members', filter: 'verified' })


  createEffect(() => {
    header.updateHeader({
      title: t('explore.servers.title'),
      iconName: 'explore',
    });
  })

  createEffect(() => {
    getPublicServers(query().sort as any, query().filter as any).then(servers => {
      setPublicServers(servers);
    })
  })

  const sortOpts: DropDownItem[] = [
    { id: 'most_bumps', label: t('explore.servers.sortMostBumps') },
    { id: 'most_members', label: t('explore.servers.sortMostMembers') },
    { id: 'recently_added', label: t('explore.servers.sortRecentlyAdded') },
    { id: 'recently_bumped', label: t('explore.servers.sortRecentlyBumped') },
  ];

  const filterOpts: DropDownItem[] = [
    { id: 'all', label: t('explore.servers.filterAll') },
    { id: 'verified', label: t('explore.servers.filterVerified') },
  ];

  const update = (newPublicServer: RawPublicServer, index: number) => {
    const current = [...publicServers()!];
    current[index] = newPublicServer;
    setPublicServers(current);
  }

  return (
    <Container>
      <Show when={publicServers()}>
        <FlexRow gap={10}>
          <DropDown title='Sort' items={sortOpts} selectedId="most_members" onChange={i => setQuery({ ...query(), sort: i.id })} />
          <DropDown title='Filter' items={filterOpts} selectedId="verified" onChange={i => setQuery({ ...query(), filter: i.id })} />
        </FlexRow>
        <Notice type='info' description={t('explore.servers.noticeMessage', { hours: '3', date: 'Monday at 0:00 UTC' })} />
        <Notice class={css`margin-bottom: 10px;`} type='warn' description="Servers are not moderated by Nerimity. Please report servers that break the TOS." />
        <GridLayout>
          <For each={publicServers()}>
            {(server, i) => <PublicServerItem update={newServer => update(newServer, i())} publicServer={server} />}
          </For>
        </GridLayout>
      </Show>
    </Container>
  )
}


const ServerItemContainer = styled(FlexColumn)`
  padding: 5px;
  background: rgba(255,255,255,0.04);
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  max-height: 300px;
`;
const DetailsContainer = styled(FlexColumn)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 8px;
  margin-left: 5px;
  margin-right: 5px;
  margin-bottom: 0;
`;

const MemberContainer = styled(FlexRow)`
  align-items: center;
`;

const serverNameStyles = css`
  word-break: break-word;
  white-space: pre-line;

  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`
const avatarStyles = css`
  margin-top: -40px;
  margin-left: 10px;
`;

const descriptionStyles = css`
  margin-top: 3px;
  word-break: break-word;
  white-space: pre-line;

  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  margin-left: 5px;
  margin-right: 5px;

`;

const ButtonsContainer = styled(FlexRow)`
  margin-top: auto;
  padding-top: 5px;
  margin-left: auto;
  flex-shrink: 0;
`;

function PublicServerItem(props: { publicServer: RawPublicServer, update: (newServer: RawPublicServer) => void }) {
  const [t] = useTransContext();
  const server = props.publicServer.server!;
  const [joinClicked, setJoinClicked] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const navigate = useNavigate();

  const { createPortal } = useCustomPortal();

  const { servers } = useStore();

  const cacheServer = () => servers.get(server.id);

  const joinServerClick = async () => {
    if (joinClicked()) return;
    setJoinClicked(true);
    await joinPublicServer(props.publicServer.serverId).catch((err) => {
      alert(err.message)
    })
    setJoinClicked(false)
  }

  const bumpClick = () => {

    // 3 hours to milliseconds
    const bumpAfter = 3 * 60 * 60 * 1000;

    const millisecondsSinceLastBump = new Date().getTime() - props.publicServer.bumpedAt;
    const timeLeftMilliseconds = bumpAfter - millisecondsSinceLastBump;
    const timeLeft = new Date(timeLeftMilliseconds);

    if (timeLeftMilliseconds > 0) {
      alert(`You must wait ${timeLeft.getUTCHours()} hours, ${timeLeft.getUTCMinutes()} minutes and ${timeLeft.getUTCSeconds()} seconds to bump this server.`);
      return;
    }
    return createPortal(close => <ServerBumpModal update={props.update} publicServer={props.publicServer} close={close} />)
  }

  createEffect(() => {
    if (joinClicked() && cacheServer()) {
      navigate(RouterEndpoints.SERVER_MESSAGES(cacheServer()!.id, cacheServer()!.defaultChannelId));
    }
  })



  return (
    <ServerItemContainer class="serverItemContainer" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Banner margin={0} animate={hovered()} class={css`width: 100%; flex-shrink: initial;`} maxHeight={100} url={bannerUrl(props.publicServer.server!)} hexColor={props.publicServer.server?.hexColor} />
      <Avatar class={avatarStyles} animate={hovered()} server={server} size={60} />
      <DetailsContainer class='detailsContainer' gap={1}>
        <FlexRow style={{ "align-items": "center" }} gap={5}>
          <Text class={serverNameStyles} size={18}>{server.name}</Text>
          <Show when={server.verified}><ServerVerifiedIcon /></Show>
        </FlexRow>
        <MemberContainer gap={5}>
          <FlexRow gap={5}>
            <Icon name='people' size={17} color="var(--primary-color)" />
            <Text size={12}>{t('explore.servers.memberCount', { count: server._count.serverMembers.toLocaleString() })}</Text>
          </FlexRow>
          <FlexRow gap={5}>
            <Icon name='arrow_upward' size={17} color="var(--primary-color)" />
            <Text size={12}>{t('explore.servers.lifetimeBumpCount', { count: props.publicServer.lifetimeBumpCount.toLocaleString() })}</Text>
          </FlexRow>
        </MemberContainer>
      </DetailsContainer>
      <Text class={descriptionStyles} size={14} opacity={0.7}>{props.publicServer.description}</Text>
      <ButtonsContainer>
        <Button padding={8} iconSize={18} onClick={bumpClick} iconName='arrow_upward' label={t('explore.servers.bumpButton', { count: props.publicServer.bumpCount.toLocaleString() })} />
        <Show when={cacheServer()}><Link style={{ "text-decoration": "none" }} href={RouterEndpoints.SERVER_MESSAGES(cacheServer()!.id, cacheServer()!.defaultChannelId)}><Button padding={8} iconSize={18} iconName='login' label={t('explore.servers.visitServerButton')} /></Link></Show>
        <Show when={!cacheServer()}><Button padding={8} iconSize={18} onClick={joinServerClick} iconName='login' label={t('explore.servers.joinServerButton')} /></Show>
      </ButtonsContainer>
      <FlexRow style={{ "align-items": 'center', "margin-left": "auto", "margin-right": "5px" }} gap={5}>
        <Icon name='schedule' size={14} color='rgba(255,255,255,0.8)' />
        <Text size={12} color='rgba(255,255,255,0.6)'>Last bumped {timeSince(props.publicServer.bumpedAt)}</Text>
      </FlexRow>
    </ServerItemContainer>
  )
}

const ServerBumpModalContainer = styled(FlexRow)`
  justify-content: center;
  align-items: center;
  padding: 10px;
`

export function ServerBumpModal(props: { update(server: RawPublicServer): void; publicServer: RawPublicServer; close(): void; }) {
  let [verifyToken, setVerifyKey] = createSignal<string | undefined>(undefined);
  let turnstileRef: TurnstileRef | undefined;


  const bumpServer = () => {
    BumpPublicServer(props.publicServer.serverId, verifyToken())
      .then(newPublicServer => {
        props.update(newPublicServer);
        props.close();
      })
      .catch((err) => {
        setVerifyKey(undefined);
        alert(err.message)
        turnstileRef?.reset();
      })
  }

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", width: '100%' }}>
      <Button iconName='close' onClick={props.close} color='var(--alert-color)' label='Back' />
      <Show when={verifyToken()}>
        <Button iconName='arrow_upward' label='Bump' onClick={bumpServer} />
      </Show>
    </FlexRow>
  )


  return (
    <Modal title={`Bump ${props.publicServer.server?.name}`} close={props.close} actionButtons={ActionButtons} >
      <ServerBumpModalContainer>
        <Turnstile
          ref={turnstileRef}
          sitekey={env.TURNSTILE_SITEKEY!}
          onVerify={setVerifyKey}
          autoResetOnExpire={true}
        />
      </ServerBumpModalContainer>
    </Modal>
  )
}