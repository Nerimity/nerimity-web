import { useNavigate } from 'solid-app-router';
import { createStore, reconcile } from 'solid-js/store';


export interface Tab {
  title: string;
  iconName?: string;
  path: string;
  subName?: string;
  userId?: string;
  serverId?: string;
  isPreview: boolean;
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


const openTab = (tab: Omit<Tab, 'isPreview'>) => {

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
  
  const previewTabIndex = tabs.findIndex(t => t.isPreview);
  if (previewTabIndex >= 0) {
    setTabs(previewTabIndex, reconcile({...tab, isPreview: true}));

  } else {
    const newTab = {...tab, isPreview: true};
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