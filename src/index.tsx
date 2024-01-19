/* @refresh reload */
import "./init";
import { render } from "solid-js/web";
import "material-icons/iconfont/round.scss";
import "./index.css";
import App from "./App";
import { CustomPortalProvider } from "@/components/ui/custom-portal/CustomPortal";
import { A, Outlet, Route, Router, useNavigate, useParams, Navigate } from "solid-navigator";
import en from "@/locales/list/en-gb.json";
import { TransProvider } from "@mbarzda/solid-i18next";
import styles from "./Index.module.scss";
import { useWindowProperties } from "./common/useWindowProperties";
import { Component, JSXElement, createEffect, lazy, on, onMount } from "solid-js";
import RouterEndpoints from "./common/RouterEndpoints";
import InboxDrawer from "./components/inbox/drawer/InboxDrawer";
import DashboardPane from "./components/DashboardPane";
import ChannelPane from "./components/channel-pane/ChannelPane";
import ServerDrawer from "./components/servers/drawer/ServerDrawer";
import RightDrawer from "./components/right-drawer/RightDrawer";
import ProfilePane from "./components/profile-pane/ProfilePane";

const HomePage = lazy(() => import('./pages/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AppPage = lazy(() => import('./pages/AppPage'));

const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));
const GoogleRedirectLinkAccount = lazy(() => import('./pages/GoogleRedirectLinkAccountPage'));


const useBlurEffect = () => {
  const { isWindowFocusedAndBlurEffectEnabled } = useWindowProperties();

  createEffect(
    on(isWindowFocusedAndBlurEffectEnabled, () => {
      if (isWindowFocusedAndBlurEffectEnabled()) {
        document.body.classList.remove("disableBlur");
      } else {
        document.body.classList.add("disableBlur");
      }
    })
  );
};

const useMobileInterface = () => {
  const { isMobileAgent } = useWindowProperties();
  if (!isMobileAgent()) {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      /* width */
      *::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
    
      /* Track */
      *::-webkit-scrollbar-track {
        background-color: rgba(48, 48, 48, 0.4);
        border-top-right-radius: 7px;
        border-bottom-right-radius: 7px;
      }
    
      /* Handle */
      *::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 8px;
    
      }
    `;
    document.head.appendChild(styleEl);
  }
};



const Root = () => {
  return (
    <TransProvider
      options={{
        fallbackLng: "en_gb",
        lng: "en_gb",
        resources: { en_gb: { translation: en } },
      }}
    >
      <CustomPortalProvider>
        <App/>
        <Outlet/>
      </CustomPortalProvider>
    </TransProvider>
  );
};

render(() => {
  useBlurEffect();
  useMobileInterface();

  return (
    <Router root={Root}>

      <Route path="/app" component={AppPage}  components={{leftDrawer: InboxDrawer, mainPane: DashboardPane}}>

    
        <Route path="/inbox/:channelId" components={{mainPane: ChannelPane, rightDrawer: RightDrawer}} />
        <Route path="/servers/:serverId/:channelId" components={{mainPane: ChannelPane, leftDrawer: ServerDrawer, rightDrawer: RightDrawer}} />
        <Route path="/profile/:userId" components={{mainPane: ProfilePane, leftDrawer: undefined, rightDrawer: undefined}} />
        

        <Route path="/*"/>
      
      </Route>


       
    
      <Route path="/" component={HomePage}/>
      <Route path="/register" component={RegisterPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms-and-conditions" component={TermsAndConditionsPage} /> 
      <Route path="/google-redirect" component={GoogleRedirectLinkAccount} /> 
      <Route path="/i/:inviteId" component={InviteRedirect} />
      
      <Route path="/*" component={NoMatch} />
    </Router>
  );
}, document.getElementById("root") as HTMLElement);




function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <A href="/">Go to the home page</A>
      </p>
    </div>
  );
}


function InviteRedirect() {
  const params = useParams();

  return <Navigate href={RouterEndpoints.EXPLORE_SERVER_INVITE(params.inviteId!)} />
}

