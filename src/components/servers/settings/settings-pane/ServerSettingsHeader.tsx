
import { Link, useParams } from '@nerimity/solid-router';
import { Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '@/common/RouterEndpoints';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn } from '@/components/ui/Flexbox';

const HeaderContainer = styled("div")`
  display: flex;
  align-items: center;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  &:after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
  }
`;

const DetailsContainer = styled(FlexColumn)`
  margin-left: 10px;
  font-size: 18px;
  z-index: 1111;
`;

const avatarStyles = css`
  z-index: 111;
`;

const ServerSettingsHeader = () => {
  const params = useParams();
  const {servers, serverMembers} = useStore();
  const server = () => servers.get(params.serverId!);
  const serverMembersCount = () => serverMembers.array(params.serverId!).length;

  return (
    <Show when={server()}>
      <HeaderContainer style={{background: server()?.hexColor}}>
        <Avatar hexColor={server()!.hexColor} size={80} class={avatarStyles} />
        <DetailsContainer>
          <Text>{server()!.name}</Text>
          <Text size={14} opacity={0.8}>{serverMembersCount()} members</Text>
          <Text size={14}><Link href={RouterEndpoints.SERVER_SETTINGS_GENERAL(server()!.id)}>Edit Server</Link></Text>
        </DetailsContainer>
      </HeaderContainer>
    </Show>
  )
};


export default ServerSettingsHeader;