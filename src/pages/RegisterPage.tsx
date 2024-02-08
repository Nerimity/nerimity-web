import Input from '@/components/ui/input/Input';
import { registerRequest } from '../chat-api/services/UserService';
import Button from '@/components/ui/Button';
import { getStorageString, setStorageString, StorageKeys } from '../common/localStorage';
import { A, useNavigate, useLocation } from 'solid-navigator';
import { createSignal, onMount, Show } from 'solid-js';
import env from '../common/env';
import PageHeader from '../components/PageHeader';
import { css, styled } from 'solid-styled-components';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import { useTransContext } from '@mbarzda/solid-i18next';
import { Turnstile, TurnstileRef } from '@nerimity/solid-turnstile';
import Text from '@/components/ui/Text';
import PageFooter from '@/components/PageFooter';
import Icon from '@/components/ui/icon/Icon';

const RegisterPageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled(FlexColumn)`
  background: var(--pane-color);
  height: 100%;
  border-radius: 8px;
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  overflow: auto;
  flex: 1;
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
  margin-bottom: 10px;
`;

const linkStyle = css`
  margin-top: 20px;
  display: block;
  text-align: center;
`;

const NoticesContainer = styled(FlexColumn)`
  background-color: rgba(255, 255, 255, 0.1);
  padding: 5px;
  border-radius: 6px;
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

  const registerClicked = async (event?: SubmitEvent | MouseEvent) => {
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

    if (password().length > 72) {
      setError({message: 'Password must be less than 72 characters.', path: 'Password'});
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
        <form style={{display: 'flex', "flex-direction": 'column'}} action='#' onSubmit={registerClicked}>
          <Title>{t('registerPage.title', {appName: env.APP_NAME})}</Title>
          <NoticesContainer gap={5}>
            <Text style={{"font-weight": 'bold'}} color='var(--warn-color)'>Notices</Text>

            <Text color="rgba(255, 255, 255, 0.8)" style={{"align-items": 'center', display: 'flex', gap: "5px"}} size={14}><Icon name="info" size={14} color='var(--warn-color)' /> Please keep toxicity out of here.</Text>
            <Text color="rgba(255, 255, 255, 0.8)" style={{"align-items": 'center', display: 'flex', gap: "5px"}} size={14}><Icon name="info" size={14} color='var(--warn-color)' /> NSFW content is against the TOS.</Text>
            <Text color="rgba(255, 255, 255, 0.8)" style={{"align-items": 'center', display: 'flex', gap: "5px"}} size={14}><Icon name="info" size={14} color='var(--warn-color)' /> You must be over the age of 14 to use Nerimity.</Text>
          </NoticesContainer>
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
          <A class={linkStyle} href="/login">{t('registerPage.loginInstead')}</A>
        </Container>
      </Content>
      <PageFooter/>
    </RegisterPageContainer>
  )
}

