import { Navigator } from 'solid-app-router';
import {createStore} from 'solid-js/store';


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
let lastPath: string | null = null;

const isTabOpened = (path: string) => tabs.find(tab => tab.path === path);


const updateTab = (path: string, tab: Partial<Tab>) => {
  const tabIndex = tabs.findIndex(t => t.path === path);
  if (tabIndex >= 0) {
    setTabs(tabIndex, { ...tabs[tabIndex], ...tab });
  }
}

const selectTab = (path: string, navigate: Navigator) => {
    const tab = tabs.find(tab => tab.path === path);
    if (!tab) return;

    if (!lastPath) {
      lastPath = tab.path;
      return;
    }

    if (lastPath === tab.path) return 
    lastPath = tab.path;
    navigate(tab.path);

}

const closeTab = (path: string) => {
  setTabs(tabs.filter(tab => tab.path !== path));
}


const openTab = (tab: Omit<Tab, 'opened'>, navigate: Navigator, select = true) => {

  const tabAlreadyOpened = isTabOpened(tab.path);
  if (tabAlreadyOpened) {
    select && selectTab(tab.path, navigate);
    return;
  };

  const unopenedTabIndex = tabs.findIndex(t => !t.opened);
  if (unopenedTabIndex >= 0) {
    setTabs(unopenedTabIndex, {...tab, opened: false});
  } else {
    const newTab = {...tab, opened: false};
    setTabs([...tabs, newTab]);
  }

  select && selectTab(tab.path, navigate);

}


export default function useTabs() {
  return {
    isTabOpened,
    updateTab,
    selectTab,
    closeTab,
    openTab,
    array: tabs
  }
}