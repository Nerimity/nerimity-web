import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import { createInvite, getInvites} from '@/chat-api/services/ServerService';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import env from '@/common/env';
import { classNames, conditionalClass } from '@/common/classNames';
import { formatTimestamp } from '@/common/date';
import Icon from '@/components/ui/icon/Icon';
import { Link, useParams } from '@nerimity/solid-router';
import { createEffect, createSignal, For, onMount, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { useWindowProperties } from '@/common/useWindowProperties';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import { copyToClipboard } from '@/common/clipboard';
import { FlexRow } from '@/components/ui/Flexbox';
import Input from '@/components/ui/input/Input';
import { Notice } from '@/components/ui/Notice';
import { css } from 'solid-styled-components';

export default function ServerSettingsInvite() {
  const params = useParams<{serverId: string}>();
  const {header, servers} = useStore();
  const windowProperties = useWindowProperties();
  const [invites, setInvites] = createSignal<any[]>([]);

  const mobileSize = () => windowProperties.paneWidth()! < 550

  const server = () => servers.get(params.serverId)



  
  onMount(() => {
    getInvites(params.serverId!).then((invites) => setInvites(invites.reverse()));
  })
  
  createEffect(() => {

    header.updateHeader({
      title: "Settings - Invites",
      serverId: params.serverId!,
      iconName: 'settings',
    });
  })



  const onCreateInviteClick = async () => {
    await createInvite(params.serverId!);
    getInvites(params.serverId!).then((invites) => setInvites(invites.reverse()));
  }


  const prefixUrl = env.APP_URL + RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT("");


  return (
    <div class={classNames(styles.invitesPane, conditionalClass(mobileSize(), styles.mobile))}>
      <div class={styles.title}>Server Invites</div>

      <Show when={!server()?.verified}>
        <Notice class={css`margin-bottom: 10px;`} type='info' description='Custom invite links are only available for verified servers.'/>
      </Show>

      <SettingsBlock class={css`&&{position: relative; overflow: hidden; margin-bottom: 30px; ${!server()?.verified ? 'cursor: not-allowed; opacity: 0.6;' : ''} }`} label='Custom Link' icon='link'>
        <Show when={!server()?.verified}>
          <div style={{ position: 'absolute', inset: 0, "z-index": 1111}} />
        </Show>
        <Input prefix={prefixUrl} />
      </SettingsBlock>

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
      <Avatar class={styles.avatar} hexColor={props.invite.createdBy.hexColor} size={30} />
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
        <FlexRow class={styles.buttons}>
          <Button onClick={() => copyToClipboard(url)} class={classNames(styles.copyButton, styles.button)} label='Copy Link' iconName='copy' />
          <Button class={classNames(styles.deleteButton, styles.button)} label='Delete' iconName='delete' color='var(--alert-color)' />
        </FlexRow>
      </div>
    </div>
  )
};