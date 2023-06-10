import Input from '@/components/ui/input/Input';
import { loginRequest } from '../chat-api/services/UserService';
import Button from '@/components/ui/Button';
import { getStorageString, setStorageString, StorageKeys } from '../common/localStorage';
import { Link, useNavigate, useLocation } from '@solidjs/router';
import { createSignal, onMount } from 'solid-js';
import PageHeader from '../components/PageHeader';
import { css, styled,  } from 'solid-styled-components';
import { FlexColumn } from '@/components/ui/Flexbox';
import { useTransContext } from '@nerimity/solid-i18next';

const LoginPageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const Content = styled(FlexColumn)`
  background: var(--pane-color);
  height: 100%;
  border-radius: 8px;
  margin: 8px;
  margin-top: 0;
  overflow: auto;
`;

const Container = styled(FlexColumn)`
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
  const [t] = useTransContext();
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

  const loginClicked = async (event?: SubmitEvent) => {
    event?.preventDefault();
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
      <Content>
        <Container class='container'>
          <form action='#' onsubmit={loginClicked}>
            <Title>{t('loginPage.title')}</Title>
            <Input margin={[10, 0, 10, 0]} label={t('loginPage.emailOrUsernameAndTag')} errorName={["email", "usernameAndTag"]}  type='text' error={error()} onText={setEmail} />
            <Input margin={[10, 0, 10, 0]} label={t('loginPage.password')} type='password' error={error()} onText={setPassword} />
            <Button iconName='login' label={requestSent() ? t('loginPage.loggingIn') : t('loginPage.loginButton')} onClick={loginClicked} />
          </form>
          <Link class={linkStyle} href="/register">{t('loginPage.createAccountInstead')}</Link>
        </Container>
      </Content>
    </LoginPageContainer>
  );
}

