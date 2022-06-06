import styles from './styles.module.scss'
import RouterEndpoints from '../../common/RouterEndpoints';
import { createInvite, getInvites} from '../../chat-api/services/ServerService';
import Avatar from '../Avatar/Avatar';
import CustomButton from '../CustomButton/CustomButton';
import env from '../../common/env';
import { classNames, conditionalClass } from '../../common/classNames';
import { formatTimestamp } from '../../common/date';
import { Icon } from '../Icon/Icon';
import { Link, useParams } from 'solid-app-router';
import { createEffect, createSignal, For } from 'solid-js';
import useStore from '../../chat-api/store/useStore';

export default function ServerSettingsInvite() {
  const params = useParams();
  const {tabs} = useStore();
  const [invites, setInvites] = createSignal<any[]>([]);
  const [mobileSize, isMobileSize] = createSignal(false);


  // useEffect(() => {
  //   const destroy = autorun(() => {
  //     const isMobile = store.windowPropertyStore?.mainPaneWidth! < env.MOBILE_WIDTH;
  //     isMobileSize(isMobile);
  //   })
  //   return destroy;
  // }, [])
  
  
  createEffect(() => {
    getInvites(params.serverId!).then((invites) => setInvites(invites.reverse()));


    tabs.openTab({
      title: "Settings - Invites",
      serverId: params.serverId!,
      iconName: 'settings',
      path: location.pathname,
    }, false);
  })



  const onCreateInviteClick = async () => {
    await createInvite(params.serverId!);
    getInvites(params.serverId!).then((invites) => setInvites(invites.reverse()));
  }



  return (
    <div class={classNames(styles.invitesPane, conditionalClass(mobileSize, styles.mobile))}>
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