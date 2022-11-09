import Input from '@/components/ui/input/Input';
import { registerRequest } from '../chat-api/services/UserService';
import Button from '@/components/ui/Button';
import { getStorageString, setStorageString, StorageKeys } from '../common/localStorage';
import { Link, useNavigate, useLocation } from '@nerimity/solid-router';
import { createSignal, onMount } from 'solid-js';
import env from '../common/env';
import PageHeader from '../components/PageHeader';
import { css, styled } from 'solid-styled-components';

const RegisterPageContainer = styled("div")`
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

export default function RegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  
  onMount(() => {
    if (getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate('/app', {replace: true});
    }
  })

  const registerClicked = async () => {
    const redirectTo = location.query.redirect || "/app"
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: '', path: ''});
    
    if (password() !== confirmPassword()) {
      setError({message: 'Confirm password does not match.', path: 'Confirm Password'});
      setRequestSent(false);
      return;
    }
    const response = await registerRequest(email(), username().trim(), password().trim()).catch(err => {
      setError({message: err.message, path: err.path});
    })
    setRequestSent(false);
    if (!response) return;
    setStorageString(StorageKeys.USER_TOKEN, response.token);
    navigate(redirectTo)
  }

  return (
    <RegisterPageContainer class="register-page-container">
      <PageHeader />
      <Container>
        <Title>Welcome to {env.APP_NAME}</Title>
        <Input label='Email' type='email' error={error()} onText={setEmail} />
        <Input label='Username' error={error()} onText={setUsername} />
        <Input label='Password' type='password' error={error()} onText={setPassword} />
        <Input label='Confirm Password' type='password' error={error()} onText={setConfirmPassword} />
        <Button iconName='login' label={requestSent() ? 'Registering...' : 'Register'} onClick={registerClicked} />
        <Link class={linkStyle} href="/login">Login Instead</Link>
      </Container>
    </RegisterPageContainer>
  )
}

