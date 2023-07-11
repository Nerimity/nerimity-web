/* @refresh reload */
import { render } from 'solid-js/web';
import 'material-icons/iconfont/round.scss';
import './index.css';
import App from './App';
import {CustomPortalProvider} from '@/components/ui/custom-portal/CustomPortal';
import { Router } from '@solidjs/router';
import en from '@/locales/list/en-gb.json';
import { TransProvider } from '@nerimity/solid-i18next';

render(() => (
  <Router>
    <TransProvider options={{ fallbackLng: 'en_gb',  lng: "en_gb", resources: { "en_gb": {translation: en} }}}>
      <CustomPortalProvider>
        <App />
      </CustomPortalProvider>
    </TransProvider>
  </Router>
), document.getElementById('root') as HTMLElement);