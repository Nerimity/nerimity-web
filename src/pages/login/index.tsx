import styles from './styles.module.scss';
import Input from '@/components/ui/input';
import { loginRequest } from '../../chat-api/services/UserService';
import Button from '@/components/ui/button';
import { getStorageString, setStorageString, StorageKeys } from '../../common/localStorage';
import { Link, useNavigate } from 'solid-app-router';
import { createSignal, onMount } from 'solid-js';
import PageHeader from '../../components/page-header';

export default function LoginPage() {
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal({message: '', path: ''});
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  
  onMount(() => {
    if (getStorageString(StorageKeys.USER_TOKEN, null)) {
      navigate('/app');
    }
  })

  const loginClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError({message: '', path: ''});
    const response = await loginRequest(email().trim(), password().trim()).catch(err => {
      setError({message: err.message, path: err.path});
    })
    setRequestSent(false);
    if (!response) return;
    setStorageString(StorageKeys.USER_TOKEN, response.token);
    navigate('/app')
  }

  return <div class={styles.loginPage}>
    <PageHeader />
    <div class={styles.container}>
      <div class={styles.title}>Login to continue</div>
      <Input label='Email' type='email' error={error()} onText={setEmail} />
      <Input label='Password' type='password' error={error()} onText={setPassword} />
      <Button iconName='login' label={requestSent() ? 'Logging in...' : 'Login'} onClick={loginClicked} />
      <Link class={styles.link} href="/register">Create an account instead</Link>
    </div>
  </div>
}

