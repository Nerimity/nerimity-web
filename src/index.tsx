/* @refresh reload */
import { render } from 'solid-js/web';

import 'material-icons/iconfont/round.scss';
import './index.css';
import App from './App';

import {CustomPortalProvider} from '@/components/ui/custom-portal';

import {createRouter, Link, navigate, useNamedRoute, useParams} from 'solid-named-router';
import CustomSuspense from './components/custom-suspense';
import { lazy, onMount } from 'solid-js';
import RouterEndpoints from './common/RouterEndpoints';

const HomePage = lazy(() => import('./pages/home'));
const RegisterPage = lazy(() => import('./pages/register'));
const LoginPage = lazy(() => import('./pages/login'));
const AppPage = lazy(() => import('./pages/app'));

render(() => {
  const Router = createRouter({
    routes: [
      {
        path: '/',
        element: () => <CustomSuspense><HomePage /></CustomSuspense>
      },
      {
        path: "/app",
        element: () => <CustomSuspense><AppPage/></CustomSuspense>,

        routes: [
          { path: "/" },
          {
            path: "/inbox(/:channelId)",
            name: "inbox"
          },
          {
            path: "/servers(/:serverId)(/:channelId)",
            name: "server"
          },
          // /servers/:serverId/settings/:path/:id?
          {
            path: "/servers/:serverId/settings/:path(/:id)",
            name: "server_settings"
          },
          {
            path: "/profile/:userId",
            name: "user_profile"
          },
          {
            path: "/explore/servers/invites/:inviteId",
            name: "explore_server"
          },
          {
            path: "/moderation",
            name: "moderation"
          },
        ]
      },
      {
        path: '/login',
        element: () => <CustomSuspense><LoginPage /></CustomSuspense>
      },
      {
        path: '/register',
        element: () => <CustomSuspense><RegisterPage /></CustomSuspense>
      },
      {
        path: "/i/:inviteId",
        element: () => <InviteRedirect/>
      },
      {
        path: '/*splat',
        element: () => <NoMatch/>
      },
    ]
  });
  return <Router><CustomPortalProvider><App /></CustomPortalProvider></Router>;
}
, document.getElementById('root') as HTMLElement);



function InviteRedirect() {
  const params = useParams();
  onMount(() => {
    navigate(RouterEndpoints.EXPLORE_SERVER_INVITE(params.inviteId!), {replace: true})
  })
  return <div>Redirecting...</div>
}





function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}