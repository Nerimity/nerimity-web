import { t } from "i18next";
import { createSignal } from "solid-js";





export interface HeaderDetail {
  title: string;
  iconName?: string;
  subName?: string;
  userId?: string;
  serverId?: string;
  channelId?: string;
  id?: "MessagePane";
}

const [details, setDetails] = createSignal<HeaderDetail>({
  title: t("misc.nothingSelected")
});


const updateHeader = (header: HeaderDetail) => {
  setDetails(header);
};



export default function useHeader() {
  return {
    updateHeader,
    details
  };
}