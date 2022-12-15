import { RawPublicServer } from '@/chat-api/RawData';
import { BumpPublicServer, getPublicServers, joinPublicServer } from '@/chat-api/services/ServerService';
import useStore from '@/chat-api/store/useStore';
import RouterEndpoints from '@/common/RouterEndpoints';
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
  const {header} = useStore();
  const [publicServers, setPublicServers] = createSignal<null | RawPublicServer[]>(null);
  const [query, setQuery] = createSignal({sort: 'most_members', filter: 'verified'})


  createEffect(() => {
    header.updateHeader({
      title: "Explore - Servers",
      iconName: 'explore',
    });
  })

  createEffect(() => {
    getPublicServers(query().sort as any, query().filter as any).then(servers => {
      setPublicServers(servers);
    })
  })

  const sortOpts: DropDownItem[] = [
    {id:'most_bumps', label: 'Most bumps'},
    {id:'most_members', label: 'Most members'},
    {id:'recently_added', label: 'Recently added'},
    {id:'recently_bumped', label: 'Recently bumped'},
  ];

  const filterOpts: DropDownItem[] = [
    {id:'all', label: 'All'},
    {id:'verified', label: 'Verified'},
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
        <Notice class={css`margin-bottom: 10px;`} type='info' description='A server can be bumped once every 3 hours. All bumps reset every Monday at 0:00 UTC.' />
        <For each={publicServers()}>
          {(server, i) => <PublicServerItem update={newServer=> update(newServer, i())} publicServer={server} />}
        </For>
      </Show>
    </Container>
  )
}


const ServerItemContainer = styled(FlexRow)`
  padding: 10px;
  background: rgba(255,255,255,0.1);
  height: 100px;
  border-radius: 8px;
  align-items: center;
  padding-left: 20px;
`;

const MemberContainer = styled(FlexRow)`
  align-items: center;
`;

const ButtonsContainer = styled(FlexRow)`
  margin-left: auto;
`;

function PublicServerItem(props: {publicServer: RawPublicServer, update: (newServer: RawPublicServer) => void}) {
  const server = props.publicServer.server!;
  let [joinClicked, setJoinClicked] = createSignal(false);
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
    <ServerItemContainer gap={15}>
      <Avatar hexColor={server.hexColor} size={80} />
      <FlexColumn gap={1}>
        <FlexRow style={{"align-items": "center"}} gap={5}>
          <Text size={18}>{server.name}</Text>
          <Show when={server.verified}><ServerVerifiedIcon /></Show>
        </FlexRow>
        <MemberContainer gap={5}>
          <Icon name='people' size={17} color="var(--primary-color)"/>
          <Text size={12}>{server._count.serverMembers.toLocaleString()} members</Text>
          <Icon name='arrow_upward' size={17} color="var(--primary-color)"/>
          <Text size={12}>{props.publicServer.lifetimeBumpCount.toLocaleString()} Lifetime bumps</Text>
        </MemberContainer>
          <Text style={{"margin-top": "5px"}} opacity={0.7}>{props.publicServer.description}</Text>
      </FlexColumn>

      <ButtonsContainer>
        <Button onClick={bumpClick} iconName='arrow_upward' label={`Bump (${props.publicServer.bumpCount.toLocaleString()})`}/>
        <Show when={cacheServer()}><Link style={{"text-decoration": "none"}} href={RouterEndpoints.SERVER_MESSAGES(cacheServer()!.id, cacheServer()!.defaultChannelId)}><Button iconName='login' label='Visit'/></Link></Show>
        <Show when={!cacheServer()}><Button onClick={joinServerClick} iconName='login' label='Join'/></Show>
      </ButtonsContainer>
    </ServerItemContainer>
  )
}