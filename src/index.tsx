/* @refresh reload */
import { render } from 'solid-js/web';
import { Router } from "@solidjs/router";

import 'material-icons/iconfont/round.scss';
import './index.css';
import App from './App';

import {CustomPortalProvider} from '@/components/ui/custom-portal';

render(() => <Router><CustomPortalProvider><App /></CustomPortalProvider></Router>, document.getElementById('root') as HTMLElement);
