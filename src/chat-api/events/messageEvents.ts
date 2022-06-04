import useMessages from "../store/useMessages";




export function onMessageCreated(payload: any) {
  const messages = useMessages();
  messages.pushMessage(payload.channel, payload);
}

export function onMessageDeleted(payload: {channelId: string, messageId: string}) {
  const messages = useMessages();
  messages.locallyRemoveMessage(payload.channelId, payload.messageId);
}