import styles from './styles.module.scss';
import CustomInput from '../../components/CustomInput';
import { registerRequest } from '../../chat-api/services/UserService';
import CustomButton from '../../components/CustomButton';
import { getStorageString, setStorageString, StorageKeys } from '../../common/localStorage';
import { Link, useNavigate } from 'solid-app-router';
import { createSignal, onMount } from 'solid-js';

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
    <div class={styles.container}>
      <div class={styles.title}>Welcome to Nertivia!</div>
      <CustomInput label='Email' type='email' error={error()} onText={setEmail} />
      <CustomInput label='Username' error={error()} onText={setUsername} />
      <CustomInput label='Password' type='password' error={error()} onText={setPassword} />
      <CustomInput label='Confirm Password' type='password' error={error()} onText={setConfirmPassword} />
      <CustomButton iconName='login' label={requestSent() ? 'Registering...' : 'Register'} onClick={registerClicked} />
      <Link class={styles.link} href="/login">Login Instead</Link>
    </div>
  </div>
}

