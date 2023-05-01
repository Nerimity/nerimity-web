import { Ban, bannedMembersList, removeBanServerMember } from "@/chat-api/services/ServerService";
import { avatarUrl } from "@/chat-api/store/useUsers";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { FlexRow } from "@/components/ui/Flexbox";
import Icon from "@/components/ui/icon/Icon";
import Text from "@/components/ui/Text";
import { Link, useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Show } from "solid-js";
import { styled } from "solid-styled-components"

const BansContainer = styled("div")`

`;

export default function ServerSettingsBans() {
  const params = useParams<{serverId: string}>();
  const [bannedMembers, {refetch}] = createResource("", () => bannedMembersList(params.serverId));

  return (
    <BansContainer>
      <Show when={bannedMembers()}>
        <For each={bannedMembers()}>
          {ban => <BanItem ban={ban} refetch={refetch}/>}
        </For>
      </Show>
    </BansContainer>
  )
}

const BanContainer = styled(FlexRow)`
  align-items: center;
  margin-left: 15px;
  margin-right: 15px;
  border-radius: 8px;
  transition: 0.2s;
  .ban-link {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 5px;
    text-decoration: none;
    padding: 5px;
  }
  &:hover {
    background-color: rgba(255,255,255,0.1);
  }
`;
  
const UnbanButtonContainer = styled(FlexRow)`
  align-items: center;
  flex-shrink: 0;
  padding: 5px;
  margin-right: 5px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  transition: 0.2s;
  opacity: 0.8;
  &:hover {
    opacity: 1;
    background-color: rgba(255,255,255,0.1);
  }
`;

function BanItem (props: {ban: Ban, refetch: () => void}) {
  const user = props.ban.user;
  const [requestSent, setRequestSent] = createSignal(false);

  const onUnbanClick = () => {
    if (requestSent()) return;
    setRequestSent(true);
    removeBanServerMember(props.ban.serverId, user.id).finally(() => {
      setRequestSent(false);
      props.refetch();
    })
  }

  return (
    <BanContainer gap={5}>
      <Link class="ban-link" href={RouterEndpoints.PROFILE(user.id)}>
        <Avatar user={user} size={26}  />
        <Text>{props.ban.user.username}</Text>
      </Link>
      <UnbanButtonContainer gap={5} onclick={onUnbanClick}>
        <Icon color="var(--alert-color)" name="undo" size={14} />
        <Text color="var(--alert-color)" size={14}>{requestSent() ? 'Unbanning' : 'Unban'}</Text>
      </UnbanButtonContainer>
    </BanContainer>
  )
}
