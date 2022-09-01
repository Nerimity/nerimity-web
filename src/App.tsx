import { Link, Navigate, Route, Routes, useParams } from '@solidjs/router';
import { lazy } from 'solid-js';
import RouterEndpoints from './common/RouterEndpoints';
import CustomSuspense from './components/custom-suspense';



const HomePage = lazy(() => import('./pages/home'));
const RegisterPage = lazy(() => import('./pages/register'));
const LoginPage = lazy(() => import('./pages/login'));
const AppPage = lazy(() => import('./pages/app'));


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomSuspense><HomePage /></CustomSuspense>} />

      <Route path="app" element={<CustomSuspense><AppPage /></CustomSuspense>} />

      <Route path="app/inbox" element={<CustomSuspense><AppPage routeName="inbox" /></CustomSuspense>} />
      <Route path="app/inbox/:channelId" element={<CustomSuspense><AppPage routeName="inbox_messages" /></CustomSuspense>} />



      <Route path="app/servers/:serverId/" element={<CustomSuspense><AppPage routeName="server" /></CustomSuspense>} />

      <Route path="app/servers/:serverId/:channelId" element={<CustomSuspense><AppPage routeName="server_messages" /></CustomSuspense>} />
      <Route path="app/servers/:serverId/settings/:path/:id?" element={<CustomSuspense><AppPage routeName="server_settings" /></CustomSuspense>} />


      <Route path="app/explore/servers/invites/:inviteId" element={<CustomSuspense><AppPage routeName="explore_server" /></CustomSuspense>} />

      <Route path="app/profile/:userId" element={<CustomSuspense><AppPage routeName="user_profile" /></CustomSuspense>} />

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