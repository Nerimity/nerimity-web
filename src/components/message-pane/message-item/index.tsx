import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import { formatTimestamp } from '@/common/date';
import Avatar from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { RawMessage } from '@/chat-api/RawData';
import { Message, MessageSentStatus } from '@/chat-api/store/useMessages';
import { deleteMessage } from '@/chat-api/services/MessageService';
import RouterEndpoints from '@/common/RouterEndpoints';
import { Link, useParams } from 'solid-named-router';
import useStore from '@/chat-api/store/useStore';
import { onMount } from 'solid-js';


function FloatOptions(props: { message: RawMessage, isCompact: boolean }) {

  const onDeleteClick = () => {
    deleteMessage({channelId: props.message.channelId, messageId: props.message.id});
  }
  
  return (
    <div class={styles.floatOptions}>
      {props.isCompact && (<div class={styles.floatDate}>{formatTimestamp(props.message.createdAt)}</div>)}
      <div class={styles.item}><Icon name='edit' class={styles.icon} /></div>
      <div class={styles.item} onClick={onDeleteClick}><Icon name='delete' class={styles.icon} color='var(--alert-color)' /></div>
    </div>
  )
}



const MessageItem = (props: { message: Message, beforeMessage?: Message, animate?: boolean }) => {

  const params = useParams();
  const {serverMembers} = useStore();
  const serverMember = () => params.serverId ? serverMembers.get(params.serverId, props.message.createdBy.id) : undefined;


  const Details = () => (
    <div class={styles.details}>
      <Link to={RouterEndpoints.PROFILE(props.message.createdBy.id)}>
        <Avatar hexColor={props.message.createdBy.hexColor} size={30} />
      </Link>
      <Link class={styles.username} to={RouterEndpoints.PROFILE(props.message.createdBy.id)} style={{color: serverMember()?.roleColor()}}>
        {props.message.createdBy.username}
      </Link>
      <div class={styles.date}>{formatTimestamp(props.message.createdAt)}</div>
    </div>
  )

  const currentTime = new Date(props.message?.createdAt).getTime();
  const beforeMessageTime = new Date(props.beforeMessage?.createdAt!).getTime()

  const isSameCreator = () => props.beforeMessage?.createdBy?.id === props.message?.createdBy?.id;
  const isDateUnderFiveMinutes = () => (currentTime- beforeMessageTime) < 300000;


  const isCompact = () => isSameCreator() && isDateUnderFiveMinutes();


  return (
    <div class={classNames(styles.messageItem, conditionalClass(isCompact(), styles.compact), conditionalClass(props.animate, styles.animate))}>
      <FloatOptions isCompact={isCompact()} message={props.message} />
      <div class={styles.messageItemOuterContainer}>
        <div class={styles.messageItemContainer}>
          {isCompact() ? null : <Details />}
          <div class={styles.messageContainer}>
            {props.message.sentStatus === MessageSentStatus.FAILED && <Icon name='error_outline' size={14} color="var(--alert-color)" class={styles.messageStatus} />}
            {props.message.sentStatus === MessageSentStatus.SENDING && <Icon name='query_builder' size={14} color="rgba(255,255,255,0.4)" class={styles.messageStatus} />}
            <div class={styles.content}>{props.message.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

