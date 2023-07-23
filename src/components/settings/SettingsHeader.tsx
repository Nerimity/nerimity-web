
import { Link } from '@solidjs/router';
import { Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '@/common/RouterEndpoints';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import env from '@/common/env';
import { avatarUrl } from '@/chat-api/store/useServers';
import { bannerUrl } from '@/chat-api/store/useUsers';
import { Banner } from '../ui/Banner';
import { useWindowProperties } from '@/common/useWindowProperties';
import { FriendStatus } from '@/chat-api/RawData';


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

const UsernameTagContainer = styled(FlexRow)`
  font-size: 16px;
  margin-bottom: 5px;
  overflow-wrap: anywhere;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* number of lines to show */
          line-clamp: 2; 
  -webkit-box-orient: vertical;
`;

const avatarStyles = css`
  z-index: 111;
`;

const SettingsHeader = (props: { headerPreviewDetails: { username?: string, tag?: string, banner?: string; avatar?: any } }) => {
  const { account, servers, friends } = useStore();
  const user = () => account.user();
  const serverCount = () => servers.array().length || "0";
  const friendCount = () => friends.array().filter(friend => friend.status === FriendStatus.FRIENDS).length || "0";
  const {width} = useWindowProperties();


  return (
    <Show when={user()}>
      <Banner maxHeight={200} animate hexColor={user()?.hexColor} url={props.headerPreviewDetails.banner || bannerUrl(user()!)}>
        <HeaderContainer>
          <Avatar animate url={props.headerPreviewDetails.avatar} user={account.user()} hexColor={user()!.hexColor} size={width() <= 500 ? 70 : 100} class={avatarStyles} />
          <DetailsContainer>
            <UsernameTagContainer>
              <Text>{props.headerPreviewDetails.username || user()!.username}</Text>
              <Text opacity={0.7}>:{props.headerPreviewDetails.tag || user()!.tag}</Text>
            </UsernameTagContainer>
            <FlexRow gap={5}>
              <Text size={14} opacity={0.8}>{serverCount()} servers</Text>
              <Text size={14}>•</Text>
              <Text size={14} opacity={0.8}>{friendCount()} friends</Text>
            </FlexRow>
            <Text size={14}><Link href="/app/settings/account">Manage Account</Link></Text>
          </DetailsContainer>
        </HeaderContainer>
      </Banner>
    </Show>
  )
};


export default SettingsHeader;