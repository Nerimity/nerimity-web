import RouterEndpoints from '@/common/RouterEndpoints';
import { runWithContext } from '@/common/runWithContext';
import { useLocation, useNavigate } from '@solidjs/router';
import { createStore, produce, reconcile } from 'solid-js/store';


export interface Tab {
  title: string;
  type?: string;
  iconName?: string;
  path: string;
  subName?: string;
  userId?: string;
  serverId?: string;
  channelId?: string;
  isPreview: boolean;
}

// const [tabs, setTabs] = createStore<Tab[]>([{"title":null,"type":"message_pane","channelId":"1280233821459095552","userId":"1279488335785664513","iconName":"inbox","path":"/app/inbox/1280233821459095552","isPreview":false},{"title":"General","type":"message_pane","serverId":"1281672892605702144","channelId":"1281672892605702145","iconName":"dns","path":"/app/servers/1281672892605702144/1281672892605702145","isPreview":false},{"title":"Settings - General","serverId":"1281672892605702144","iconName":"settings","path":"/app/servers/1281672892605702144/settings/general","isPreview":false},{"title":"Settings - Channels","serverId":"1281672892605702144","iconName":"settings","path":"/app/servers/1281672892605702144/settings/channels","isPreview":false},{"title":"Settings - General","serverId":"1281672892605702144","iconName":"settings","path":"/app/servers/1281672892605702144/settings/channels/1281672892605702145","isPreview":false},{"title":"Settings - Invites","serverId":"1281672892605702144","iconName":"settings","path":"/app/servers/1281672892605702144/settings/invites","isPreview":false},{"title":"Settings - New Channel","serverId":"1281672892605702144","iconName":"settings","path":"/app/servers/1281672892605702144/settings/channels/1281672949052645376","isPreview":false},{"title":"Settings - New Channel","serverId":"1281672892605702144","iconName":"settings","path":"/app/servers/1281672892605702144/settings/channels/1281672945399406592","isPreview":false},{"title":"New Channel","type":"message_pane","serverId":"1281672892605702144","channelId":"1281672941851025408","iconName":"dns","path":"/app/servers/1281672892605702144/1281672941851025408","isPreview":false},{"title":"New Channel","type":"message_pane","serverId":"1281672892605702144","channelId":"1281672949052645376","iconName":"dns","path":"/app/servers/1281672892605702144/1281672949052645376","isPreview":false}]);
const [tabs, setTabs] = createStore<Tab[]>([]);

const isTabOpened = (path: string) => tabs.find(tab => tab.path === path);


const updateTab = (path: string, tab: Partial<Tab>) => {
  const tabIndex = tabs.findIndex(t => t.path === path);
  if (tabIndex >= 0) {
    setTabs(tabIndex, { ...tabs[tabIndex], ...tab });
  }
}


const closeTab = (path: string) => runWithContext(() => {
  const location = useLocation();
  const navigate = useNavigate();
  
  
  if (tabs.length === 1) {
    navigate(RouterEndpoints.INBOX());
  }
  
  const tabIndex = tabs.findIndex(tab => tab.path === path);
  const tab = tabs[tabIndex];
  const currentPathname =  location.pathname;
  
  const isSelected = currentPathname === tab.path;
  
  if (isSelected && tabs.length !== 1) {
    const newTabIndex = tabIndex <= 0 ? 1 : tabIndex - 1
    navigate(tabs[newTabIndex].path);
  }
  

  // without setTimeout, the tab tries to re-open :(
  setTimeout(() => 
    setTabs(produce(tabs => tabs.splice(tabIndex, 1)))
  )
  
});


const closeTabs = (paths: string[]) => runWithContext(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedIndex = tabs.findIndex(tab => tab.path === location.pathname);

  const newList = tabs.filter(tab => !paths.includes(tab.path));
  const isSelected = paths.includes(location.pathname);

  if (isSelected) {
    if (selectedIndex > newList.length - 1) {
      navigate(newList[newList.length - 1].path);
    } else {
      navigate(newList[selectedIndex].path);
    }
  }


  setTimeout(() => 
    setTabs(reconcile(tabs.filter(tab => !paths.includes(tab.path))))
  )

})



const openTab = (tab: Omit<Tab, 'isPreview'>, opts?: {update?: boolean}) => {

  let select = true;

  if (tab.path === location.pathname) {
    select = false;
  }
  
  const navigate = useNavigate();
  
  const tabAlreadyOpened = isTabOpened(tab.path);
  if (tabAlreadyOpened) {
    if (opts?.update) {
      updateTab(tab.path, tab);
    }
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
    closeTabs,
    openTab,
    array: tabs
  }
}