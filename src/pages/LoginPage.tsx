import Input from '@/components/ui/input/Input';
import { loginRequest } from '../chat-api/services/UserService';
import Button from '@/components/ui/Button';
import { getStorageString, setStorageString, StorageKeys } from '../common/localStorage';
import { Link, useNavigate, useLocation } from '@nerimity/solid-router';
import { createSignal, onMount } from 'solid-js';
import PageHeader from '../components/PageHeader';
import { css, styled,  } from 'solid-styled-components';
import { useI18n } from '@solid-primitives/i18n';

const LoginPageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const Container = styled("div")`
  width: 300px;
  margin: auto;
  padding: 10px;
`;

const Title = styled("div")`
  color: var(--primary-color);
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
`;

const linkStyle = css`
  margin-top: 20px;
  display: block;
  text-align: center;
`;

export default function LoginPage() {
  const [t] = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  
  onMount(() => {
    if (getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate('/app', {replace: true});
    }
  })

  const loginClicked = async () => {
    const redirectTo = location.query.redirect || "/app"
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: '', path: ''});
    const response = await loginRequest(email().trim(), password().trim()).catch(err => {
      setError({message: err.message, path: err.path});
    })
    setRequestSent(false);
    if (!response) return;
    setStorageString(StorageKeys.USER_TOKEN, response.token);
    navigate(redirectTo)
  }

  return (
    <LoginPageContainer class="login-page-container">
      <PageHeader />
      <Container class='container'>
        <Title>{t('loginPage.title')}</Title>
        <Input label={t('loginPage.email')} type='email' error={error()} onText={setEmail} />
        <Input label={t('loginPage.password')} type='password' error={error()} onText={setPassword} />
        <Button iconName='login' label={requestSent() ? t('loginPage.logging_in') : t('loginPage.loginButton')} onClick={loginClicked} />
        <Link class={linkStyle} href="/register">{t('loginPage.createAccountInstead')}</Link>
      </Container>
    </LoginPageContainer>
  );
}

