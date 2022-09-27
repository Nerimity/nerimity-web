import { createSignal } from 'solid-js';


export interface HeaderDetail {
  title: string;
  iconName?: string;
  subName?: string;
  userId?: string;
  serverId?: string;
  channelId?: string
}

const [details, setDetails] = createSignal<HeaderDetail>({
  title: 'Nothing Selected',
});


const updateHeader = (header: HeaderDetail) => {
  setDetails(header);
}



export default function useHeader() {
  return {
    updateHeader,
    details
  }
}