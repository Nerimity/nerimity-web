/* @refresh reload */
import { render } from 'solid-js/web';
import 'material-icons/iconfont/round.scss';
import './index.css';
import App from './App';
import {CustomPortalProvider} from '@/components/ui/custom-portal/CustomPortal';
import { Router } from '@nerimity/solid-router';
import en from '@/locales/list/en.json';
import { TransProvider } from '@mbarzda/solid-i18next';

render(() => (
  <Router>
    <TransProvider options={{ fallbackLng: 'en',  lng: "en", resources: { en: {translation: en} }}}>
      <CustomPortalProvider>
        <App />
      </CustomPortalProvider>
    </TransProvider>
  </Router>
), document.getElementById('root') as HTMLElement);