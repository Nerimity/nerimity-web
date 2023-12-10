
import { Link, useParams } from '@solidjs/router';
import { Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '@/common/RouterEndpoints';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import { ServerVerifiedIcon } from '../../ServerVerifiedIcon';
import { useTransContext } from '@mbarzda/solid-i18next';
import { avatarUrl, bannerUrl } from '@/chat-api/store/useServers';
import { Banner } from '@/components/ui/Banner';
import { useWindowProperties } from '@/common/useWindowProperties';

const HeaderContainer = styled("div")`
position: relative;
display: flex;
align-items: center;
border-radius: 8px;
padding-left: 30px;
flex-shrink: 0;
position: relative;
overflow: hidden;
height: 100%;
`;

const DetailsContainer = styled(FlexColumn)`
  margin-left: 20px;
  margin-right: 20px;
  font-size: 18px;
  z-index: 1111;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(20px);
  padding: 10px;
  border-radius: 8px;
`;

const avatarStyles = css`
  z-index: 111;
`;

const ServerSettingsHeader = (props: { headerPreviewDetails: { name?: any, avatar?: any, banner?: string } }) => {
  const [t] = useTransContext();
  const params = useParams();
  const { servers, serverMembers } = useStore();
  const server = () => servers.get(params.serverId!);
  const serverMembersCount = () => serverMembers.array(params.serverId!).length;
  const {width} = useWindowProperties();

  return (
    <Show when={server()}>
      <Banner maxHeight={200} animate url={props.headerPreviewDetails.banner || bannerUrl(server()!)} hexColor={server()?.hexColor}>
        <HeaderContainer>
          <Avatar animate url={props.headerPreviewDetails.avatar} server={server()} size={width() <= 1100 ? 70 : 100} class={avatarStyles} />
          <DetailsContainer>
            <FlexRow gap={5}>
              <Text>{props.headerPreviewDetails.name || server()!.name}</Text>
              <Show when={server()?.verified}><ServerVerifiedIcon /></Show>
            </FlexRow>
            <Text size={14} opacity={0.8}>{t('servers.settings.header.serverMemberCount', { count: serverMembersCount() })}</Text>
            <Text size={14}><Link href={RouterEndpoints.SERVER_SETTINGS_GENERAL(server()!.id)}>{t('servers.settings.header.editServer')}</Link></Text>
          </DetailsContainer>
        </HeaderContainer>
      </Banner>
    </Show>
  )
};


export default ServerSettingsHeader;