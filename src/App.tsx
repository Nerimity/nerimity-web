import { onMount } from 'solid-js';
import { RouterView } from 'solid-named-router';

export default function App() {
  const halloweenStart = 1666652400000;
  const halloweenEnd = 1667343600000;
  const now = Date.now();

  onMount(() => {
    // check if now is between halloweenStart and halloweenEnd
    if (now > halloweenStart && now < halloweenEnd) {
      document.documentElement.style.setProperty('--primary-color', '#df6f1a');
    }
  })

  return (
    <RouterView />
  )

};