import { Link, Navigate, Route, Routes, useParams } from 'solid-app-router';
import { lazy } from 'solid-js';
import RouterEndpoints from './common/RouterEndpoints';
import CustomSuspense from './components/CustomSuspense';

const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AppPage = lazy(() => import('./pages/AppPage'));


export default function App() {
  return (
    <Routes>
      <Route path="app" element={<CustomSuspense><AppPage /></CustomSuspense>} />

      <Route path="app/inbox" element={<CustomSuspense><AppPage routeName="inbox" /></CustomSuspense>} />
      <Route path="app/inbox/:channelId" element={<CustomSuspense><AppPage routeName="inbox_messages" /></CustomSuspense>} />



      <Route path="app/servers/:serverId/:channelId" element={<CustomSuspense><AppPage routeName="server_messages" /></CustomSuspense>} />
      <Route path="app/servers/:serverId/settings/:path" element={<CustomSuspense><AppPage routeName="server_settings" /></CustomSuspense>} />


      <Route path="app/explore/servers/invites/:inviteId" element={<CustomSuspense><AppPage routeName="explore_server" /></CustomSuspense>} />
      <Route path="i/:inviteId" element={ <InviteRedirect/> } />



      <Route path="login" element={<CustomSuspense><LoginPage /></CustomSuspense>} />
      <Route path="register" element={<CustomSuspense><RegisterPage /></CustomSuspense>} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
};


function InviteRedirect() {
  const { inviteId } = useParams();
  return <Navigate href={RouterEndpoints.EXPLORE_SERVER_INVITE(inviteId!)} />
}


function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link href="/">Go to the home page</Link>
      </p>
    </div>
  );
}