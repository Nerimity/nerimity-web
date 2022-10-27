import { onMount } from 'solid-js';
import { RouterView } from 'solid-named-router';
import { isHalloween } from './worldEvents';

export default function App() {


  onMount(() => {
    if (isHalloween) {
      document.documentElement.style.setProperty('--primary-color', '#df6f1a');
    }
  })

  return (
    <RouterView />
  )

};