import { createStore } from 'solid-js/store';


export interface HeaderDetail {
  title: string;
  iconName?: string;
  subName?: string;
  userId?: string;
  serverId?: string;
}

const [header, setHeader] = createStore<HeaderDetail>({
  title: 'Loading...',
});


const updateHeader = (header: Partial<HeaderDetail>) => {
  setHeader(header);
}



export default function useHeader() {
  return {
    updateHeader,
    header
  }
}