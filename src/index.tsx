/* @refresh reload */
import "./init";
import { render } from "solid-js/web";
// import "material-icons/iconfont/round.css";
import "material-symbols/rounded.css";
import "./index.css";
import App from "./App";
import { CustomPortalProvider } from "@/components/ui/custom-portal/CustomPortal";
import { A, Outlet, Route, Router, useParams, Navigate } from "solid-navigator";
import en from "@/locales/list/en-gb.json";
import { TransProvider } from "@mbarzda/solid-i18next";
import { useWindowProperties } from "./common/useWindowProperties";
import { For, Show, createEffect, lazy, on } from "solid-js";
import RouterEndpoints from "./common/RouterEndpoints";
import settings from "./common/Settings";
import exploreRoutes from "./common/exploreRoutes";
import serverSettings from "./common/ServerSettings";
import useStore from "./chat-api/store/useStore";
import ModerationPane from "./components/moderation-pane/ModerationPane";
import TicketsPage from "@/components/tickets/TicketsPage";
import { TicketPage } from "./components/settings/TicketSettings";

// Drawers
const SettingsDrawer = lazy(() => import("@/components/settings/SettingsDrawer"));
const ServerDrawer = lazy(() => import("@/components/servers/drawer/ServerDrawer"));
const InboxDrawer = lazy(() => import("@/components/inbox/drawer/InboxDrawer"));
const ExploreDrawer = lazy(() => import("@/components/explore/ExploreDrawer"));
const ServerSettingsDrawer = lazy(() => import("@/components/servers/settings/ServerSettingsDrawer"));

const RightDrawer = lazy(() => import("@/components/right-drawer/RightDrawer"));

// App Panes
const ChannelPane = lazy(() => import("@/components/channel-pane/ChannelPane"));
const ProfilePane = lazy(() => import("@/components/profile-pane/ProfilePane"));
const DashboardPane = lazy(() => import("@/components/DashboardPane"));
const ExplorePane = lazy(() => import("@/components/explore/ExplorePane"));
const SettingsPane = lazy(() => import("@/components/settings/SettingsPane"));
const ServerSettingsPane = lazy(() => import("@/components/servers/settings/settings-pane/ServerSettingsPane"));
const ExploreServerPane = lazy(() => import("@/components/servers/explore-pane/ExploreServerPane"));

const ServerCustomizePane = lazy(() => import("@/components/servers/customize-pane/ServerCustomizePane"));

// Pages
const HomePage = lazy(() => import("./pages/HomePage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AppPage = lazy(() => import("./pages/AppPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const InviteServerBotPage = lazy(() => import("./pages/InviteServerBot"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const TermsAndConditionsPage = lazy(() => import("./pages/TermsAndConditionsPage"));
const GoogleRedirectLinkAccount = lazy(() => import("./pages/GoogleRedirectLinkAccountPage"));

const ModerationUserPage = lazy(() => import("@/components/moderation-pane/UserPage"));
const ModerationServerPage = lazy(() => import("@/components/moderation-pane/ServerPage"));


const useBlurEffect = () => {
  const { isWindowFocusedAndBlurEffectEnabled } = useWindowProperties();

  createEffect(
    on(isWindowFocusedAndBlurEffectEnabled, () => {
      if (isWindowFocusedAndBlurEffectEnabled()) {
        document.body.classList.remove("disableBlur");
      }
      else {
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
  if (isMobileAgent()) {
    document.getElementById("root")?.classList.add("mobileAgent");
  }
};


const Root = () => {
  return (
    <TransProvider
      options={{
        fallbackLng: "en_gb",
        lng: "en_gb",
        resources: { en_gb: { translation: en } }
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
  const {account} = useStore();

  return (
    <Router root={Root}>
      <Route path="/app" component={AppPage}  components={{leftDrawer: InboxDrawer, mainPane: DashboardPane}}>
        <Route path="/inbox/:channelId" components={{mainPane: ChannelPane, rightDrawer: RightDrawer}} />

        <Route path="/servers/:serverId/" components={{leftDrawer: ServerDrawer, rightDrawer: RightDrawer}}>
          <Route path="/welcome" components={{mainPane: ServerCustomizePane}} />
          <Route path="/:channelId" components={{mainPane: ChannelPane}} />

          {/* Server Settings */}
          <Route path="/settings" components={{leftDrawer: ServerSettingsDrawer, mainPane: ServerSettingsPane}}>
            <For each={serverSettings}>
              {(setting) => <Route path={setting.routePath} components={{settingsPane: setting.element}} />}
            </For>
          </Route>
          <Route path="/*" components={{settingsPane: undefined}}  />
        </Route>

        <Route path="/profile/:userId/:tab?" components={{mainPane: ProfilePane, leftDrawer: undefined, rightDrawer: undefined}} />

        <Route path="/explore" components={{mainPane: ExplorePane, leftDrawer: ExploreDrawer}}>
          <For each={exploreRoutes}>
            {(paths) => <Route path={paths.routePath} components={{explorePane: paths.element}} />}
          </For>
          <Route path="/servers/invites/:inviteId" components={{mainPane: ExploreServerPane}} />
          <Route path="/*" components={{explorePane: undefined}}  />
        </Route>

        {/* User Settings */}
        <Route path="/settings" components={{leftDrawer: SettingsDrawer, mainPane: SettingsPane}}>
          <For each={settings}>
            {(setting) => <Route path={setting.routePath} components={{settingsPane: setting.element}} />}
          </For>
          <Route path="/*" components={{settingsPane: undefined}}  />
        </Route>

        <Show when={account.hasModeratorPerm()}>
          <Route path="/moderation" components={{mainPane: ModerationPane, leftDrawer: InboxDrawer}}>
            <Route path="/servers/:serverId" components={{moderationPane: ModerationServerPage}} />
            <Route path="/users/:userId" components={{moderationPane: ModerationUserPage}} />
            <Route path="/tickets" components={{moderationPane: TicketsPage}}>
              <Route path="/:id" components={{moderationPane: TicketPage}} />
            </Route>
            <Route path="/*" components={{moderationPane: undefined}}  />
          </Route>
        </Show>   

        <Route path="/*" components={{mainPane: DashboardPane, RightDrawer: undefined, leftDrawer: InboxDrawer}} />
      </Route>


      <Route path="/" component={HomePage}/>
      <Route path="/register" component={RegisterPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms-and-conditions" component={TermsAndConditionsPage} /> 
      <Route path="/google-redirect" component={GoogleRedirectLinkAccount} /> 
      <Route path="/i/:inviteId" component={InviteRedirect} />
      <Route path="/p/:postId" component={PostRedirect} />
      <Route path="/bot/:appId" component={InviteServerBotPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
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

  return <Navigate href={RouterEndpoints.EXPLORE_SERVER_INVITE(params.inviteId!)} />;
}

function PostRedirect() {
  const params = useParams();

  return <Navigate href={`/app?postId=${params.postId!}`} />;
}

