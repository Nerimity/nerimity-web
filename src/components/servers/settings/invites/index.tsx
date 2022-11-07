import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import { createInvite, getInvites} from '@/chat-api/services/ServerService';
import Avatar from '@/components/ui/avatar';
import Button from '@/components/ui/button';
import env from '@/common/env';
import { classNames, conditionalClass } from '@/common/classNames';
import { formatTimestamp } from '@/common/date';
import Icon from '@/components/ui/icon';
import { Link, useParams } from '@solidjs/router';
import { createEffect, createSignal, For, onMount } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { useWindowProperties } from '@/common/useWindowProperties';
import SettingsBlock from '@/components/ui/settings-block';
import { copyToClipboard } from '@/common/clipboard';

export default function ServerSettingsInvite() {
  const {serverId} = useParams();
  const {header} = useStore();
  const windowProperties = useWindowProperties();
  const [invites, setInvites] = createSignal<any[]>([]);
  const [mobileSize, isMobileSize] = createSignal(false);


  createEffect(() => {
    const isMobile = windowProperties.paneWidth()! < env.MOBILE_WIDTH;
    isMobileSize(isMobile);
  })
  
  onMount(() => {
    getInvites(serverId!).then((invites) => setInvites(invites.reverse()));
  })
  
  createEffect(() => {

    header.updateHeader({
      title: "Settings - Invites",
      serverId: serverId!,
      iconName: 'settings',
    });
  })



  const onCreateInviteClick = async () => {
    await createInvite(serverId!);
    getInvites(serverId!).then((invites) => setInvites(invites.reverse()));
  }



  return (
    <div class={classNames(styles.invitesPane, conditionalClass(mobileSize(), styles.mobile))}>
      <div class={styles.title}>Server Invites</div>

      <SettingsBlock label='Create a new invite' icon='add'>
        <Button label='Create Invite' onClick={onCreateInviteClick} />
      </SettingsBlock>


      <SettingsBlock label='Server Invites' description='Invite your friends to this server.' icon='mail' header={true} />
      <For each={invites()}>
        {(invite) => (
          <InviteItem invite={invite} />
        )}
      </For>
    </div>
  )
}


const InviteItem =(props: {invite: any}) => {
  const url = env.APP_URL + RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT(props.invite.code);

  return (
    <div class={styles.inviteItem}>
      <Avatar hexColor={props.invite.createdBy.hexColor} size={30} />
      <div class={styles.detailsOuter}>
        <div class={styles.details}>
          <Link href={RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT(props.invite.code)} class={styles.url}>{url}</Link>
          <div class={styles.otherDetails}>
            <Icon name='person' size={14} class={styles.icon} />
            {props.invite.createdBy.username}
            <Icon name='whatshot' size={14} class={styles.icon} />
            {props.invite.uses} uses
            <Icon name='today' size={14} class={styles.icon} />
            {formatTimestamp(props.invite.createdAt)}</div>
        </div>
        <Button onClick={() => copyToClipboard(url)} class={classNames(styles.copyButton, styles.button)} label='Copy Link' iconName='copy' />
        <Button class={classNames(styles.deleteButton, styles.button)} label='Delete' iconName='delete' color='var(--alert-color)' />
      </div>
    </div>
  )
};