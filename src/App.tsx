import { onMount } from 'solid-js';
import { RouterView } from 'solid-named-router';
import env from './common/env';
import { isHalloween } from './worldEvents';

export default function App() {


  onMount(() => {
    document.title = env.APP_NAME
    if (isHalloween) {
      document.documentElement.style.setProperty('--primary-color', '#df6f1a');
    }
  })

  return (
    <RouterView />
  )

};