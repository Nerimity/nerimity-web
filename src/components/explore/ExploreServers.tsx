import { RawPublicServer } from '@/chat-api/RawData';
import { BumpPublicServer, getPublicServers, joinPublicServer } from '@/chat-api/services/ServerService';
import { avatarUrl } from '@/chat-api/store/useServers';
import useStore from '@/chat-api/store/useStore';
import RouterEndpoints from '@/common/RouterEndpoints';
import { useTransContext } from '@nerimity/solid-i18next';
import { Link, useNavigate } from '@nerimity/solid-router';
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
import { Notice } from '../ui/Notice';
import Text from '../ui/Text';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;

export default function LanguageSettings() {
  const [t] = useTransContext();
  const {header} = useStore();
  const [publicServers, setPublicServers] = createSignal<null | RawPublicServer[]>(null);
  const [query, setQuery] = createSignal({sort: 'most_members', filter: 'verified'})


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
    {id:'most_bumps', label: t('explore.servers.sortMostBumps')},
    {id:'most_members', label: t('explore.servers.sortMostMembers')},
    {id:'recently_added', label: t('explore.servers.sortRecentlyAdded')},
    {id:'recently_bumped', label: t('explore.servers.sortRecentlyBumped')},
  ];

  const filterOpts: DropDownItem[] = [
    {id:'all', label: t('explore.servers.filterAll')},
    {id:'verified', label: t('explore.servers.filterVerified')},
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
          <DropDown title='Sort' items={sortOpts} selectedId="most_members" onChange={i => setQuery({...query(), sort: i.id})} />
          <DropDown title='Filter' items={filterOpts} selectedId="verified" onChange={i => setQuery({...query(), filter: i.id})} />
        </FlexRow>
        <Notice class={css`margin-bottom: 10px;`} type='info' description={t('explore.servers.noticeMessage', {hours: '3', date: 'Monday at 0:00 UTC'})} />
        <For each={publicServers()}>
          {(server, i) => <PublicServerItem update={newServer=> update(newServer, i())} publicServer={server} />}
        </For>
      </Show>
    </Container>
  )
}


const ServerItemContainer = styled(FlexRow)`
  padding: 10px;
  background: rgba(255,255,255,0.04);
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.5);
  min-height: 100px;
  border-radius: 8px;
  align-items: center;
  padding-left: 20px;

  @media (max-width: 600px){
    flex-direction: column;
    min-height: 230px;
    padding-top: 30px;
    padding-left: 0;
  }

`;

const DetailsContainer = styled(FlexColumn)`

@media (max-width: 600px){
  align-self: start;
  margin-left: 10px;
}

`;

const MemberContainer = styled(FlexRow)`
  align-items: center;
`;



const ButtonsContainer = styled(FlexRow)`
  margin-left: auto;
  flex-shrink: 0;
`;

function PublicServerItem(props: {publicServer: RawPublicServer, update: (newServer: RawPublicServer) => void}) {
  const [t] = useTransContext();
  const server = props.publicServer.server!;
  let [joinClicked, setJoinClicked] = createSignal(false);
  let [hovered, setHovered] = createSignal(false);
  const navigate = useNavigate();

  const {servers} = useStore();

  const cacheServer = () => servers.get(server.id);

  const joinServerClick = () => {
    if (joinClicked()) return;
    setJoinClicked(true);
    joinPublicServer(props.publicServer.serverId).catch((err) => {
      alert(err.message)
    })
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


    BumpPublicServer(props.publicServer.serverId)
      .then(newPublicServer => {
        props.update(newPublicServer);
      })
      .catch((err) => {
        alert(err.message)
      })
  }

  createEffect(() => {
    if (joinClicked() && cacheServer()) {
      navigate(RouterEndpoints.SERVER_MESSAGES(cacheServer()!.id, cacheServer()!.defaultChannelId));
    }
  })

  return (
    <ServerItemContainer gap={15} onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}>
      <Avatar animate={hovered()} url={avatarUrl(server)} hexColor={server.hexColor} size={80} />
      <DetailsContainer gap={1}>
        <FlexRow style={{"align-items": "center"}} gap={5}>
          <Text size={18}>{server.name}</Text>
          <Show when={server.verified}><ServerVerifiedIcon /></Show>
        </FlexRow>
        <MemberContainer gap={5}>
          <Icon name='people' size={17} color="var(--primary-color)"/>
          <Text size={12}>{t('explore.servers.memberCount', {count: server._count.serverMembers.toLocaleString()})}</Text>
          <Icon name='arrow_upward' size={17} color="var(--primary-color)"/>
          <Text size={12}>{t('explore.servers.lifetimeBumpCount', {count: props.publicServer.lifetimeBumpCount.toLocaleString()})}</Text>
        </MemberContainer>
          <Text style={{"margin-top": "5px", "word-break": "break-word", "white-space": "pre-line"}} opacity={0.7}>{props.publicServer.description}</Text>
      </DetailsContainer>

      <ButtonsContainer>
        <Button onClick={bumpClick} iconName='arrow_upward' label={t('explore.servers.bumpButton', {count: props.publicServer.bumpCount.toLocaleString()})}/>
        <Show when={cacheServer()}><Link style={{"text-decoration": "none"}} href={RouterEndpoints.SERVER_MESSAGES(cacheServer()!.id, cacheServer()!.defaultChannelId)}><Button iconName='login' label={t('explore.servers.visitServerButton')}/></Link></Show>
        <Show when={!cacheServer()}><Button onClick={joinServerClick} iconName='login' label={t('explore.servers.joinServerButton')}/></Show>
      </ButtonsContainer>
    </ServerItemContainer>
  )
}