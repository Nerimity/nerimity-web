import { onMount, lazy } from 'solid-js';
import env from './common/env';
import { isHalloween } from './common/worldEvents';
import RouterEndpoints from './common/RouterEndpoints';
import { Link, Route, Routes, useNavigate, useParams } from '@nerimity/solid-router';

const HomePage = lazy(() => import('./pages/home/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AppPage = lazy(() => import('./pages/app/AppPage'));

export default function App() {
  onMount(() => {
    document.title = env.APP_NAME
    if (isHalloween) {
      document.documentElement.style.setProperty('--primary-color', '#d76623');
    }
  })

  return (
    <Routes>
      <Route path="/" component={HomePage} />
      <Route path="/app/*" component={AppPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/i/:inviteId" component={InviteRedirect} />
      <Route path="/*" component={NoMatch} />
    </Routes>
  )
};

function InviteRedirect() {
  const params = useParams();
  const navigate = useNavigate();

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
        <Link href="/">Go to the home page</Link>
      </p>
    </div>
  );
}