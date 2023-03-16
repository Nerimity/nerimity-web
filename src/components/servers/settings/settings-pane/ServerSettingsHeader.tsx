
import { Link, useParams } from '@nerimity/solid-router';
import { Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '@/common/RouterEndpoints';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import { ServerVerifiedIcon } from '../../ServerVerifiedIcon';
import { useTransContext } from '@nerimity/solid-i18next';

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

const ServerSettingsHeader = (props: {headerPreviewDetails: {name?: any, avatar?: any}}) => {
  const [t] = useTransContext();
  const params = useParams();
  const {servers, serverMembers} = useStore();
  const server = () => servers.get(params.serverId!);
  const serverMembersCount = () => serverMembers.array(params.serverId!).length;

  return (
    <Show when={server()}>
      <HeaderContainer style={{background: server()?.hexColor}}>
        <Avatar animate url={props.headerPreviewDetails.avatar || server()!.avatarUrl()} hexColor={server()!.hexColor} size={80} class={avatarStyles} />
        <DetailsContainer>
          <FlexRow gap={5}>
            <Text>{props.headerPreviewDetails.name || server()!.name}</Text>
            <Show when={server()?.verified}><ServerVerifiedIcon/></Show>
          </FlexRow>
          <Text size={14} opacity={0.8}>{t('servers.settings.header.serverMemberCount', {count: serverMembersCount()})}</Text>
          <Text size={14}><Link href={RouterEndpoints.SERVER_SETTINGS_GENERAL(server()!.id)}>{t('servers.settings.header.editServer')}</Link></Text>
        </DetailsContainer>
      </HeaderContainer>
    </Show>
  )
};


export default ServerSettingsHeader;