
import { Link } from '@nerimity/solid-router';
import { Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '@/common/RouterEndpoints';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import env from '@/common/env';
import { avatarUrl } from '@/chat-api/store/useServers';


const BannerContainer = styled("div")`
  position: absolute;
  inset: 0;
  filter: brightness(70%);
  
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;

  &::after {
    content: '';
    position: absolute;
    backdrop-filter: blur(50px);
    z-index: 111111;
    inset: 0;
  }
`;
const HeaderContainer = styled("div")`
  position: relative;
  display: flex;
  align-items: center;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
`;

const DetailsContainer = styled(FlexColumn)`
  margin-left: 10px;
  font-size: 18px;
  z-index: 1111;
`;

const avatarStyles = css`
  z-index: 111;
`;

const SettingsHeader = (props: {headerPreviewDetails: {username?: string, tag?: string, avatar?: any}}) => {
  const {account, servers, friends} = useStore();
  const user = () => account.user();
  const serverCount = () => servers.array().length || "0";
  const friendCount = () => friends.array().length || "0";


  return (
    <Show when={user()}>
      <HeaderContainer>
        <BannerContainer
         style={{
            ...(user()?.avatar ? {
              "background-image": `url(${avatarUrl(user()!) + (user()?.avatar?.endsWith(".gif") ? '?type=png' : '')})`,
            } : {
              background: user()?.hexColor
            }),
            
          }}
         />
        <Avatar animate url={props.headerPreviewDetails.avatar} user={account.user()} hexColor={user()!.hexColor} size={80} class={avatarStyles} />
        <DetailsContainer>
          <FlexRow>
            <Text>{props.headerPreviewDetails.username || user()!.username}</Text>
            <Text opacity={0.7}>:{props.headerPreviewDetails.tag || user()!.tag}</Text>
          </FlexRow>
          <FlexRow gap={5}>
            <Text size={14} opacity={0.8}>{serverCount()} servers</Text>
            <Text size={14}>•</Text>
            <Text size={14} opacity={0.8}>{friendCount()} friends</Text>
          </FlexRow>
          <Text size={14}><Link href="/app/settings/account">Manage Account</Link></Text>
        </DetailsContainer>
      </HeaderContainer>
    </Show>
  )
};


export default SettingsHeader;