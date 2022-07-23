import styles from './styles.module.scss'
import RouterEndpoints from '../../common/RouterEndpoints';
import { createInvite, getInvites} from '../../chat-api/services/ServerService';
import Avatar from '../Avatar';
import CustomButton from '../CustomButton';
import env from '../../common/env';
import { classNames, conditionalClass } from '../../common/classNames';
import { formatTimestamp } from '../../common/date';
import Icon from '../Icon';
import { Link, useParams } from 'solid-app-router';
import { createEffect, createSignal, For, onMount } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { useWindowProperties } from '../../common/useWindowProperties';

export default function ServerSettingsInvite() {
  const {serverId} = useParams();
  const {tabs} = useStore();
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

    tabs.openTab({
      title: "Settings - Invites",
      serverId: serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_INVITES(serverId!),
    });
  })



  const onCreateInviteClick = async () => {
    await createInvite(serverId!);
    getInvites(serverId!).then((invites) => setInvites(invites.reverse()));
  }



  return (
    <div class={classNames(styles.invitesPane, conditionalClass(mobileSize(), styles.mobile))}>
      <div class={styles.title}>Server Invites</div>
      <CustomButton label='Create Invite' iconName='add' class={styles.createInviteButton} onClick={onCreateInviteClick} />
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
        <CustomButton class={classNames(styles.copyButton, styles.button)} label='Copy Link' iconName='copy' />
        <CustomButton class={classNames(styles.deleteButton, styles.button)} label='Delete' iconName='delete' color='var(--alert-color)' />
      </div>
    </div>
  )
};