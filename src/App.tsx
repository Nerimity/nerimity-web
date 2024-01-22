import { onMount, lazy, Show } from 'solid-js';
import env from './common/env';
import { isChristmas, isHalloween } from './common/worldEvents';
import RouterEndpoints from './common/RouterEndpoints';
import { A, Route, Router, useNavigate, useParams } from 'solid-navigator';
import { getCurrentLanguage, getLanguage } from './locales/languages';
import { useTransContext } from '@mbarzda/solid-i18next';
import { electronWindowAPI } from './common/Electron';
import { ElectronTitleBar } from './components/ElectronTitleBar';
import { useWindowProperties } from './common/useWindowProperties';
import styles from './App.module.scss';
import { ConnectingStatusHeader } from './components/connecting-status-header/ConnectingStatusHeader';
import { useStore } from './store';



export default function App() {
  const [, actions] = useTransContext();
  onMount(() => {
    document.title = env.APP_NAME
    if (isHalloween) {
      document.documentElement.style.setProperty('--primary-color', '#d76623');
      document.documentElement.style.setProperty('--primary-color-dark', '#241e1a');

      document.documentElement.style.setProperty('--alert-color', '#866ebf');
      document.documentElement.style.setProperty('--alert-color-dark', '#27242e');
    }
    if (isChristmas) {
      document.documentElement.style.setProperty('--primary-color', '#34a65f');
      document.documentElement.style.setProperty('--primary-color-dark', '#222c26');
    }
    setLanguage();
  })

  const setLanguage = async () => {
    const key = getCurrentLanguage();
    if (!key) return;
    if (key === "en_gb") return;
    const language = await getLanguage(key);
    if (!language) return;
    actions.addResources(key, "translation", language);
    actions.changeLanguage(key);
  }

  return (
    <>
      <Show when={electronWindowAPI()?.isElectron}>
        <ElectronTitleBar />
      </Show>
      <ConnectingStatusHeader/>
    </>
  )
};

