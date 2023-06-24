import Input from '@/components/ui/input/Input';
import { registerRequest } from '../chat-api/services/UserService';
import Button from '@/components/ui/Button';
import { getStorageString, setStorageString, StorageKeys } from '../common/localStorage';
import { Link, useNavigate, useLocation } from '@solidjs/router';
import { createSignal, onMount, Show } from 'solid-js';
import env from '../common/env';
import PageHeader from '../components/PageHeader';
import { css, styled } from 'solid-styled-components';
import { FlexColumn } from '@/components/ui/Flexbox';
import { useTransContext } from '@nerimity/solid-i18next';
import { Turnstile, TurnstileRef } from '@nerimity/solid-turnstile';
import Text from '@/components/ui/Text';
import PageFooter from '@/components/PageFooter';

const RegisterPageContainer = styled("div")`
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
  margin-bottom: 0;
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

export default function RegisterPage() {
  const [t] = useTransContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  let verifyToken = '';
  let turnstileRef: TurnstileRef | undefined;
  
  onMount(() => {
    if (getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate('/app', {replace: true});
    }
  })

  const registerClicked = async (event?: SubmitEvent) => {
    event?.preventDefault();
    const redirectTo = location.query.redirect || "/app"
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: '', path: ''});
    
    if (password() !== confirmPassword()) {
      setError({message: 'Confirm password does not match.', path: 'Confirm Password'});
      setRequestSent(false);
      return;
    }
    const response = await registerRequest(email(), username().trim(), password().trim(), verifyToken).catch(err => {
      setError({message: err.message, path: err.path});
      turnstileRef?.reset();
    })
    setRequestSent(false);
    if (!response) return;
    setStorageString(StorageKeys.USER_TOKEN, response.token);
    setStorageString(StorageKeys.FIRST_TIME, "true");
    navigate(redirectTo)
  }

  return (
    <RegisterPageContainer class="register-page-container">
      <PageHeader />
      <Content>
        <Container>
        <form style={{display: 'flex', "flex-direction": 'column'}} action='#' onsubmit={registerClicked}>
          <Title>{t('registerPage.title', {appName: env.APP_NAME})}</Title>
          <Input margin={[10, 0, 10, 0]} label={t('registerPage.email')} type='email' error={error()} onText={setEmail} />
          <Input margin={[10, 0, 10, 0]} label={t('registerPage.username')} error={error()} onText={setUsername} />
          <Input margin={[10, 0, 10, 0]} label={t('registerPage.password')} type='password' error={error()} onText={setPassword} />
          <Input margin={[10, 0, 10, 0]} label={t('registerPage.confirmPassword')} type='password' error={error()} onText={setConfirmPassword} />
          <Turnstile
            ref={turnstileRef}
            sitekey={env.TURNSTILE_SITEKEY}
            onVerify={(token) => verifyToken = token}
            autoResetOnExpire={true}
          />
          <Show when={!error().path || error().path === "other" || error().path === "token"}>
            <Text size={16}  color='var(--alert-color)'>{error().message}</Text>
          </Show>
          <Text style={{"margin-top": "10px"}} size={12} opacity={0.8}>By creating an account, you are agreeing to the Terms and conditions and the privacy policy.</Text>
          <Button primary styles={{flex: 1}} margin={[10,0,0,0]} iconName='login' label={requestSent() ? t('registerPage.registering') : t('registerPage.registerButton')} onClick={registerClicked} />
          </form>
          <Link class={linkStyle} href="/login">{t('registerPage.loginInstead')}</Link>
        </Container>
      </Content>
      <PageFooter/>
    </RegisterPageContainer>
  )
}

