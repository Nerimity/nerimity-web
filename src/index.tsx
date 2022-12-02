/* @refresh reload */
import { render } from 'solid-js/web';
import 'material-icons/iconfont/round.scss';
import './index.css';
import App from './App';
import {CustomPortalProvider} from '@/components/ui/custom-portal/CustomPortal';
import { Router } from '@nerimity/solid-router';
import { createI18nContext, I18nContext } from '@solid-primitives/i18n';
import en from '@/locales/list/en.json';

const value = createI18nContext({en}, "en");

render(() => (
  <Router>
    <I18nContext.Provider value={value}>
      <CustomPortalProvider>
        <App />
      </CustomPortalProvider>
    </I18nContext.Provider>
  </Router>
), document.getElementById('root') as HTMLElement);