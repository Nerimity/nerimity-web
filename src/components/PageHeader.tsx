import {
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
  For,
  onCleanup,
} from "solid-js";
import { css, styled } from "solid-styled-components";
import { A } from "solid-navigator";
import env from "@/common/env";
import { getUserDetailsRequest } from "@/chat-api/services/UserService";
import { RawUser } from "@/chat-api/RawData";
import { getStorageString, StorageKeys } from "@/common/localStorage";
import Icon from "./ui/icon/Icon";
import { appLogoUrl } from "@/common/worldEvents";
import { useTransContext } from "@nerimity/solid-i18lite";
import { logout } from "@/common/logout";
import { Skeleton } from "./ui/skeleton/Skeleton";
import Avatar from "./ui/Avatar";
import {
  languages,
  getLanguage,
  getCurrentLanguage,
  setCurrentLanguage,
} from "@/locales/languages";

const HeaderContainer = styled("header")`
  display: flex;
  align-items: center;
  height: 58px;
  flex-shrink: 0;
  &:after {
    background-color: var(--pane-color);
  }
  border: solid 1px rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  align-self: center;
  margin-top: 14px;
  box-sizing: border-box;

  @media (max-width: 820px) {
    margin-left: 10px;
    margin-right: 10px;
    width: calc(100% - 20px);
  }
`;

const titleContainerStyle = css`
  display: flex;
  align-items: center;
  font-size: 20px;
  align-self: center;
  height: 38px;
  padding-left: 6px;
  padding-right: 6px;
  margin-left: 8px;
  color: white;
  text-decoration: none;
  transition: 0.2s;
  border-radius: 6px;
  &:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const Title = styled("div")`
  margin-left: 10px;
  padding-right: 4px;
  font-weight: bold;
  @media (max-width: 500px) {
    display: none;
  }
`;

const Logo = styled("img")`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
`;

const NavigationContainer = styled("nav")`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  margin-right: 4px;

  .register-button div {
    background: #4c93ff;
    background: linear-gradient(to right, #4c93ff 0%, #6a5dff 100%);
    margin-right: 8px;
    &:hover {
      opacity: 0.8;
    }
  }
`;

const LinkContainer = styled("div")<{ primary: boolean }>`
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: 0.2s;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  height: 34px;
  padding-left: 8px;
  padding-right: 8px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  && {
    ${(props) =>
      props.primary
        ? `
        background-color: var(--primary-color);
        opacity: 0.9;
        transition: 0.2s;
        &:hover {
          opacity: 1;
        }
      `
        : undefined}
  }
`;

const linkIconStyle = css`
  margin-right: 5px;
`;

const [user, setUser] = createSignal<null | false | RawUser>(null);
export default function PageHeader(props: { hideAccountInfo?: boolean }) {
  onMount(async () => {
    if (props.hideAccountInfo) {
      return;
    }
    if (!getStorageString(StorageKeys.USER_TOKEN, null)) {
      return setUser(false);
    }
    setTimeout(() => {
      loadUserDetails();
    }, 1000);
  });

  const loadUserDetails = async () => {
    const details = await getUserDetailsRequest().catch((err) => {
      if (err.code === 0) {
        setTimeout(() => {
          loadUserDetails();
        }, 5000);
        return "retrying";
      }
    });
    if (details === "retrying") {
      return;
    }
    if (!details) {
      return setUser(false);
    }
    setUser(details.user);
  };

  return (
    <HeaderContainer class="header-container">
      <A href="/" class={titleContainerStyle}>
        <Logo src={appLogoUrl()} alt="logo" />
        <Title>Nerimity</Title>
      </A>
      {/* Use navigation container here, saves repeating code.. AHEM....*/}
      <NavigationContainer>
        <Show when={!props.hideAccountInfo}>
          <Switch fallback={<LogInLogOutSkeleton />}>
            <Match when={user() === false}>
              <LoggedOutLinks />
            </Match>
            <Match when={user()}>
              <LoggedInLinks user={user() as RawUser} />
            </Match>
          </Switch>
        </Show>
      </NavigationContainer>
      <LanguageDropdown />
    </HeaderContainer>
  );
}

function LanguageDropdown() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [context, actions] = useTransContext();
  let containerRef: HTMLDivElement | undefined;

  // Closes the menu if the user clicks literally anywhere else on their screen
  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  onMount(() => {
    window.addEventListener("click", handleClickOutside);
    onCleanup(() => window.removeEventListener("click", handleClickOutside));
  });

  const changeLang = async (key: string) => {
    const formattedKey = key.replace("-", "_");
    if (formattedKey !== "en_gb") {
      const language = await getLanguage(formattedKey);
      if (language) actions.addResources(formattedKey, "translation", language);
    }

    actions.changeLanguage(formattedKey);
    setCurrentLanguage(formattedKey);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "flex",
        "align-items": "center",
        height: "38px",
        "margin-right": "10px",
      }}
    >
      {/* The main button. It's an icon. It triggers things. You know the drill.*/}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen());
        }}
        class={css`
          cursor: pointer;
          padding: 0 10px;
          display: flex;
          align-items: center;
          height: 100%;
          border-radius: 6px;
          transition: 0.2s;
          opacity: 0.6;
          &:hover {
            background-color: rgba(255, 255, 255, 0.08);
            opacity: 1;
          }
        `}
      >
        <Icon name="translate" size={20} />
      </div>
      <Show when={isOpen()}>
        <div
          class={css`
            position: absolute;
            top: 45px;
            right: 0;
            background: var(--background-color);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            z-index: 1000;
            padding: 5px;
            min-width: 200px;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
          `}
        >
          <For each={Object.keys(languages)}>
            {(key) => {
              const lang = (languages as any)[key];
              const isActive = () => {
                const current =
                  context.locale || getCurrentLanguage() || "en-gb";
                return current.replace("_", "-") === key;
              };

              return (
                <div
                  onClick={() => changeLang(key)}
                  class={css`
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    color: white;
                    font-size: 14px;
                    background: ${isActive()
                      ? "rgba(255,255,255,0.05)"
                      : "transparent"};
                    &:hover {
                      background: rgba(255, 255, 255, 0.1);
                    }
                  `}
                >
                  <span style={{ flex: 1 }}>{lang.name}</span>
                  <Show when={isActive()}>
                    <Icon name="check" size={16} color="var(--primary-color)" />
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

function LogInLogOutSkeleton() {
  return (
    <>
      <Skeleton.Item width="92px" height="34px" />
      <Skeleton.Item width="112px" height="34px" />
      <Skeleton.Item
        width="38px"
        height="38px"
        style={{
          "border-radius": "50%",
          "margin-left": "6px",
          "margin-right": "6px",
        }}
      />
    </>
  );
}

function LoggedInLinks(props: { user: RawUser }) {
  const [t] = useTransContext();
  const onLogoutClick = () => {
    logout();
  };

  return (
    <>
      <HeaderLink
        href="#"
        color="var(--alert-color)"
        onClick={onLogoutClick}
        label={t("header.logoutButton")}
        icon="logout"
      />
      <HeaderLink
        href="/app"
        label={t("header.openAppButton")}
        primary={true}
        icon="open_in_browser"
      />
      <Avatar
        size={34}
        user={props.user}
        class={css`
          margin-left: 6px;
          margin-right: 6px;
        `}
      />
    </>
  );
}

function LoggedOutLinks() {
  const [t] = useTransContext();
  return (
    <>
      <HeaderLink href="/login" label={t("header.loginButton")} icon="login" />
      <HeaderLink
        href="/register"
        label={t("header.joinNowButton")}
        class="register-button"
        icon="add"
      />
    </>
  );
}

function HeaderLink(props: {
  icon?: string;
  href: string;
  label: string;
  class?: string;
  color?: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={props.href}
      onClick={props.onClick}
      style={{ "text-decoration": "none" }}
      class={props.class}
    >
      <LinkContainer
        primary={props.primary || false}
        style={{ color: props.color }}
      >
        <Show when={props.icon}>
          <Icon name={props.icon} color={props.color} class={linkIconStyle} />
        </Show>
        {props.label}
      </LinkContainer>
    </a>
  );
}
