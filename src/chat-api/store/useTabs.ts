import { Navigator, useNavigate } from 'solid-app-router';
import {createStore, reconcile} from 'solid-js/store';


export interface Tab {
  title: string;
  iconName?: string;
  path: string;
  subName?: string;
  userId?: string;
  serverId?: string;
  opened: boolean;
}

const [tabs, setTabs] = createStore<Tab[]>([]);

const isTabOpened = (path: string) => tabs.find(tab => tab.path === path);


const updateTab = (path: string, tab: Partial<Tab>) => {
  const tabIndex = tabs.findIndex(t => t.path === path);
  if (tabIndex >= 0) {
    setTabs(tabIndex, { ...tabs[tabIndex], ...tab });
  }
}


const closeTab = (path: string) => {
  setTabs(tabs.filter(tab => tab.path !== path));
}


const openTab = (tab: Omit<Tab, 'opened'>) => {

  let select = true;

  if (tab.path === location.pathname) {
    select = false;
  }
  
  const navigate = useNavigate();
  
  const tabAlreadyOpened = isTabOpened(tab.path);
  if (tabAlreadyOpened) {
    select && navigate(tab.path);
    return;
  };
  
  const unopenedTabIndex = tabs.findIndex(t => !t.opened);
  if (unopenedTabIndex >= 0) {
    setTabs(unopenedTabIndex, reconcile({...tab, opened: false}));

  } else {
    const newTab = {...tab, opened: false};
    setTabs([...tabs, newTab]);
  }

  select && navigate(tab.path);

}


export default function useTabs() {
  return {
    isTabOpened,
    updateTab,
    closeTab,
    openTab,
    array: tabs
  }
}