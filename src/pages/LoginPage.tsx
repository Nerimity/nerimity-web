import Input from '@/components/ui/input/Input';
import { loginRequest } from '../chat-api/services/UserService';
import Button from '@/components/ui/button/Button';
import { getStorageString, setStorageString, StorageKeys } from '../common/localStorage';
import { Link, useNavigate, useLocation } from '@nerimity/solid-router';
import { createSignal, onMount } from 'solid-js';
import PageHeader from '../components/PageHeader';
import { css, styled,  } from 'solid-styled-components';

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
        <Title>Login to continue</Title>
        <Input label='Email' type='email' error={error()} onText={setEmail} />
        <Input label='Password' type='password' error={error()} onText={setPassword} />
        <Button iconName='login' label={requestSent() ? 'Logging in...' : 'Login'} onClick={loginClicked} />
        <Link class={linkStyle} href="/register">Create an account instead</Link>
      </Container>
    </LoginPageContainer>
  );
}

