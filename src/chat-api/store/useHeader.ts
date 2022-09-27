import { createStore } from 'solid-js/store';


export interface HeaderDetail {
  title: string;
  iconName?: string;
  subName?: string;
  userId?: string;
  serverId?: string;
  channelId?: string
}

const [details, setDetails] = createStore<HeaderDetail>({
  title: 'Nothing Selected',
});


const updateHeader = (header: Partial<HeaderDetail>) => {
  setDetails(header);
}



export default function useHeader() {
  return {
    updateHeader,
    details
  }
}