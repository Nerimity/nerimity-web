/* @refresh reload */
import "./init";
import { render } from "solid-js/web";
import "@material-symbols/font-400/rounded.css";
import "./index.css";
import App from "./App";
import { CustomPortalProvider } from "@/components/ui/custom-portal/CustomPortal";
import { A, Outlet, Route, Router, useParams, Navigate } from "solid-navigator";
import en from "@/locales/list/en-gb.json";
import { TransProvider } from "@mbarzda/solid-i18next";
import { useWindowProperties } from "./common/useWindowProperties";
import { For, Show, createEffect, lazy, on, onMount } from "solid-js";
import RouterEndpoints from "./common/RouterEndpoints";
import settings from "./common/Settings";
import exploreRoutes from "./common/exploreRoutes";
import serverSettings from "./common/ServerSettings";
import { updateTheme } from "./common/themes";
import {
  getStorageString,
  removeStorage,
  setStorageString,
  StorageKeys,
} from "./common/localStorage";
import useAccount from "./chat-api/store/useAccount";
import { MetaProvider, Title } from "@solidjs/meta";

updateTheme();
fixSafariMobileContextMenu();
// check valid deviceIds Exist
navigator?.mediaDevices?.enumerateDevices?.()?.then((devices) => {
  const currentInputDevice = getStorageString(
    StorageKeys.inputDeviceId,
    undefined
  );
  const currentOutputDevice = getStorageString(
    StorageKeys.outputDeviceId,
    undefined
  );
  if (currentInputDevice) {
    const deviceId = JSON.parse(currentInputDevice);
    const exists = devices.find((d) => d.deviceId === deviceId);
    if (!exists) {
      removeStorage(StorageKeys.inputDeviceId);
    }
  }

  if (currentOutputDevice) {
    const deviceId = JSON.parse(currentOutputDevice);
    const exists = devices.find((d) => d.deviceId === deviceId);
    if (!exists) {
      removeStorage(StorageKeys.outputDeviceId);
    }
  }
});

// Drawers
const SettingsDrawer = lazy(
  () => import("@/components/settings/SettingsDrawer")
);
const ServerDrawer = lazy(
  () => import("@/components/servers/drawer/ServerDrawer")
);
const HomeDrawer = lazy(() => import("@/components/home-drawer/HomeDrawer"));
const ExploreDrawer = lazy(() => import("@/components/explore/ExploreDrawer"));
const ServerSettingsDrawer = lazy(
  () => import("@/components/servers/settings/ServerSettingsDrawer")
);

const RightDrawer = lazy(() => import("@/components/right-drawer/RightDrawer"));

// App Panes
const ChannelPane = lazy(() => import("@/components/channel-pane/ChannelPane"));
const ProfilePane = lazy(() => import("@/components/profile-pane/ProfilePane"));
const DashboardPane = lazy(() => import("@/components/DashboardPane"));
const ExplorePane = lazy(() => import("@/components/explore/ExplorePane"));
const SettingsPane = lazy(() => import("@/components/settings/SettingsPane"));
const ServerSettingsPane = lazy(
  () => import("@/components/servers/settings/settings-pane/ServerSettingsPane")
);
const ExploreServerPane = lazy(
  () => import("@/components/servers/explore-pane/ExploreServerPane")
);

const ServerCustomizePane = lazy(
  () => import("@/components/servers/customize-pane/ServerCustomizePane")
);

// Pages
const HomePage = lazy(() => import("./pages/HomePage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AppPage = lazy(() => import("./pages/AppPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const InviteServerBotPage = lazy(() => import("./pages/InviteServerBot"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const TermsAndConditionsPage = lazy(
  () => import("./pages/TermsAndConditionsPage")
);
const GoogleRedirectLinkAccount = lazy(
  () => import("./pages/GoogleRedirectLinkAccountPage")
);

const TicketsPage = lazy(() => import("./components/tickets/TicketsPage"));

const TicketPage = lazy(() => import("./pages/TicketPage"));

const ModerationPane = lazy(
  () => import("@/components/moderation-pane/ModerationPane")
);
const ModerationUserPage = lazy(
  () => import("@/components/moderation-pane/UserPage")
);
const ModerationUsersPage = lazy(
  () => import("@/components/moderation-pane/users-page/UsersPage")
);
const ModerationServerPage = lazy(
  () => import("@/components/moderation-pane/ServerPage")
);


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
  const { isMobileAgent, isSafari } = useWindowProperties();

  if (isSafari) {
    document
      .getElementById("viewport")
      ?.setAttribute(
        "content",
        "width=device-width, initial-scale=1,  interactive-widget=resizes-content, maximum-scale=1"
      );
  }
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
        resources: { en_gb: { translation: en } },
      }}
    >
      <CustomPortalProvider>
        <App />
        <Outlet />
      </CustomPortalProvider>
    </TransProvider>
  );
};

render(() => {
  useBlurEffect();
  useMobileInterface();

  const account = useAccount();

  return (
    <MetaProvider>
      <Title>Nerimity</Title>
      <Router root={Root}>
        <Route
          path="/app"
          component={AppPage}
          components={{ leftDrawer: HomeDrawer, mainPane: DashboardPane }}
        >
          <Route
            path="/inbox/:channelId"
            components={{ mainPane: ChannelPane, rightDrawer: RightDrawer }}
          />

          <Route
            path="/servers/:serverId/"
            components={{ leftDrawer: ServerDrawer, rightDrawer: RightDrawer }}
          >
            <Route
              path="/welcome"
              components={{ mainPane: ServerCustomizePane }}
            />
            <Route path="/:channelId" components={{ mainPane: ChannelPane }} />

            {/* Server Settings */}
            <Route
              path="/settings"
              components={{
                leftDrawer: ServerSettingsDrawer,
                mainPane: ServerSettingsPane,
              }}
            >
              <For each={serverSettings}>
                {(setting) => (
                  <Route
                    path={setting.routePath}
                    components={{ settingsPane: setting.element }}
                  />
                )}
              </For>
            </Route>
            <Route path="/*" components={{ settingsPane: undefined }} />
          </Route>

          <Route
            path="/profile/:userId/:tab?"
            components={{
              mainPane: ProfilePane,
              leftDrawer: undefined,
              rightDrawer: undefined,
            }}
          />

          <Route
            path="/explore"
            components={{ mainPane: ExplorePane, leftDrawer: ExploreDrawer }}
          >
            <For each={exploreRoutes}>
              {(paths) => (
                <Route
                  path={paths.routePath}
                  components={{ explorePane: paths.element }}
                />
              )}
            </For>
            <Route
              path="/servers/invites/:inviteId"
              components={{ mainPane: ExploreServerPane }}
            />
            <Route path="/*" components={{ explorePane: undefined }} />
          </Route>

          {/* User Settings */}
          <Route
            path="/settings"
            components={{ leftDrawer: SettingsDrawer, mainPane: SettingsPane }}
          >
            <For each={settings}>
              {(setting) => (
                <Route
                  path={setting.routePath}
                  components={{ settingsPane: setting.element }}
                />
              )}
            </For>
            <Route path="/*" components={{ settingsPane: undefined }} />
          </Route>

          <Show when={account.hasModeratorPerm()}>
            <Route
              path="/moderation"
              components={{ mainPane: ModerationPane, leftDrawer: HomeDrawer }}
            >
              <Route
                path="/servers/:serverId"
                components={{ moderationPane: ModerationServerPage }}
              />
              <Route
                path="/users"
                components={{ moderationPane: ModerationUsersPage }}
              />
              <Route
                path="/users/:userId"
                components={{ moderationPane: ModerationUserPage }}
              />
              <Route
                path="/tickets"
                components={{ moderationPane: TicketsPage }}
              >
                <Route
                  path="/:id"
                  components={{ moderationPane: TicketPage }}
                />
              </Route>
              <Route path="/*" components={{ moderationPane: undefined }} />
            </Route>
          </Show>

          <Route
            path="/*"
            components={{
              mainPane: DashboardPane,
              RightDrawer: undefined,
              leftDrawer: HomeDrawer,
            }}
          />
        </Route>

        <Route path="/" component={HomePage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route
          path="/terms-and-conditions"
          component={TermsAndConditionsPage}
        />
        <Route path="/google-redirect" component={GoogleRedirectLinkAccount} />
        <Route path="/i/:inviteId" component={InviteRedirect} />
        <Route path="/p/:postId" component={PostRedirect} />
        <Route path="/bot/:appId" component={InviteServerBotPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />

        <Route path="/404" component={NotFound} />
        <Route path="/*" component={AllOther} />
      </Router>
    </MetaProvider>
  );
}, document.getElementById("root") as HTMLElement);

function AllOther() {
  location.href = "/404";
  return <></>;
}
function NotFound() {
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

  return (
    <Navigate href={RouterEndpoints.EXPLORE_SERVER_INVITE(params.inviteId!)} />
  );
}

function PostRedirect() {
  const params = useParams();

  return <Navigate href={`/app?postId=${params.postId!}`} />;
}

function fixSafariMobileContextMenu() {
  const { isSafari, isMobileAgent } = useWindowProperties();
  if (!isSafari || !isMobileAgent()) return;

  let timer: number;

  let isTouchDown = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  document.addEventListener(
    "touchstart",
    (event) => {
      startX = event.touches[0]?.clientX || 0;
      startY = event.touches[0]?.clientY || 0;
      currentX = startX;
      currentY = startY;
      timer = window.setTimeout(function () {
        const diffX = Math.abs(startX - currentX);
        const diffY = Math.abs(startY - currentY);
        if (diffX >= 10 || diffY >= 10) return;
        if (event.target instanceof HTMLElement) {
          isTouchDown = true;
          const e = new MouseEvent("contextmenu", { bubbles: true });
          event.target?.dispatchEvent(e);
        }
      }, 500);
    },
    false
  );

  document.addEventListener("touchmove", (event) => {
    currentX = event.touches[0]?.clientX || 0;
    currentY = event.touches[0]?.clientY || 0;
  });

  document.addEventListener("touchend", (event) => {
    if (isTouchDown) {
      isTouchDown = false;
      event.preventDefault();
    }

    window.clearTimeout(timer);
  });
}
