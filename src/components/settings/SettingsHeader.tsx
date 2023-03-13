
import { Link } from '@nerimity/solid-router';
import { Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '@/common/RouterEndpoints';
import { css, styled } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import env from '@/common/env';

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

const SettingsHeader = (props: {headerPreviewDetails: {username?: string, tag?: string, avatar?: any}}) => {
  const {account, servers, friends} = useStore();
  const user = () => account.user();
  const serverCount = () => servers.array().length || "0";
  const friendCount = () => friends.array().length || "0";


  return (
    <Show when={user()}>
      <HeaderContainer style={{background: user()?.hexColor}}>
        <Avatar animate url={props.headerPreviewDetails.avatar || account.avatarUrl()} hexColor={user()!.hexColor} size={80} class={avatarStyles} />
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