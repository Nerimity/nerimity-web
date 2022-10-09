import RouterEndpoints from './common/RouterEndpoints';

import { RouterView } from 'solid-named-router';



export default function App() {


  return (
    <RouterView />
  )


  // return (
  //   <Routes>

  //     <Route path="app" element={<CustomSuspense><AppPage /></CustomSuspense>} />

  //     <Route path="app/inbox" element={<CustomSuspense><AppPage routeName="inbox" /></CustomSuspense>} />
  //     <Route path="app/inbox/:channelId" element={<CustomSuspense><AppPage routeName="inbox_messages" /></CustomSuspense>} />



  //     <Route path="app/servers/:serverId/" element={<CustomSuspense><AppPage routeName="server" /></CustomSuspense>} />

  //     <Route path="app/servers/:serverId/:channelId" element={<CustomSuspense><AppPage routeName="server_messages" /></CustomSuspense>} />
  //     <Route path="app/servers/:serverId/settings/:path/:id?" element={<CustomSuspense><AppPage routeName="server_settings" /></CustomSuspense>} />


  //     <Route path="app/explore/servers/invites/:inviteId" element={<CustomSuspense><AppPage routeName="explore_server" /></CustomSuspense>} />

  //     <Route path="app/profile/:userId" element={<CustomSuspense><AppPage routeName="user_profile" /></CustomSuspense>} />



  //   </Routes>
  // );
};