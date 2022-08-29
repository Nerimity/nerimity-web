import styles from './styles.module.scss';
import Input from '@/components/ui/input';
import { registerRequest } from '../../chat-api/services/UserService';
import Button from '@/components/ui/button';
import { getStorageString, setStorageString, StorageKeys } from '../../common/localStorage';
import { Link, useNavigate } from '@solidjs/router';
import { createSignal, onMount } from 'solid-js';
import env from '../../common/env';
import PageHeader from '../../components/page-header';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  
  onMount(() => {
    if (getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate('/app');
    }
  })

  const registerClicked = async () => {
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
    navigate('/app')
  }

  return <div class={styles.registerPage}>
    <PageHeader />
    <div class={styles.container}>
      <div class={styles.title}>Welcome to {env.APP_NAME}</div>
      <Input label='Email' type='email' error={error()} onText={setEmail} />
      <Input label='Username' error={error()} onText={setUsername} />
      <Input label='Password' type='password' error={error()} onText={setPassword} />
      <Input label='Confirm Password' type='password' error={error()} onText={setConfirmPassword} />
      <Button iconName='login' label={requestSent() ? 'Registering...' : 'Register'} onClick={registerClicked} />
      <Link class={styles.link} href="/login">Login Instead</Link>
    </div>
  </div>
}

