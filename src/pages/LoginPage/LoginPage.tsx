import styles from './styles.module.scss';
import CustomInput from '../../components/CustomInput/CustomInput';
import { loginRequest } from '../../chat-api/services/UserService';
import CustomButton from '../../components/CustomButton/CustomButton';
import { getStorageString, setStorageString, StorageKeys } from '../../common/localStorage';
import { Link, useNavigate } from 'solid-app-router';
import { createSignal, onMount } from 'solid-js';

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
    <div class={styles.container}>
      <div class={styles.title}>Login to continue</div>
      <CustomInput label='Email' type='email' error={error()} onText={setEmail} />
      <CustomInput label='Password' type='password' error={error()} onText={setPassword} />
      <CustomButton iconName='login' label={requestSent() ? 'Logging in...' : 'Login'} onClick={loginClicked} />
      <Link class={styles.link} href="/register">Create an account instead</Link>
    </div>
  </div>
}

