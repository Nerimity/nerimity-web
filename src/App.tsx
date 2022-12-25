import { onMount, lazy } from 'solid-js';
import env from './common/env';
import { isChristmas, isHalloween } from './common/worldEvents';
import RouterEndpoints from './common/RouterEndpoints';
import { Link, Route, Routes, useNavigate, useParams } from '@nerimity/solid-router';
import { getCurrentLanguage, getLanguage } from './locales/languages';
import { useTransContext } from '@mbarzda/solid-i18next';

const HomePage = lazy(() => import('./pages/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AppPage = lazy(() => import('./pages/AppPage'));

export default function App() {
  const [, actions] = useTransContext();
  onMount(() => {
    document.title = env.APP_NAME
    if (isHalloween) {
      document.documentElement.style.setProperty('--primary-color', '#d76623');
    }
    if (isChristmas) {
      document.documentElement.style.setProperty('--primary-color', '#34a65f');
    }
    setLanguage();
  })

  const setLanguage = async () => {
    const key = getCurrentLanguage();
    if (!key) return;
    if (key === "en_gb") return;
    const language = await getLanguage(key);
    if (!language) return;
    actions.addResources(key, "translation", language);
    actions.changeLanguage(key);
  }


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