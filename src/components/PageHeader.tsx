import { createSignal, Match, onMount, Show, Switch } from "solid-js";
import { css, styled } from "solid-styled-components";
import { A } from "solid-navigator";
import env from "@/common/env";
import { getUserDetailsRequest } from "@/chat-api/services/UserService";
import { RawUser } from "@/chat-api/RawData";
import { getStorageString, StorageKeys } from "@/common/localStorage";
import Icon from "./ui/icon/Icon";
import { appLogoUrl } from "@/common/worldEvents";
import { useTransContext } from "@mbarzda/solid-i18next";


const HeaderContainer = styled("header")`
  display: flex;
  height: 70px;
  flex-shrink: 0;
`;

const titleContainerStyle = css`
  display: flex;
  align-items: center;
  font-size: 24px;
  align-self: center;
  margin-left: 10px;
  height: 50px;
  padding-left: 10px;
  padding-right: 10px;
  color: white;
  text-decoration: none;
  transition: 0.2s;
  border-radius: 8px;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Title = styled("div")`
  margin-left: 10px;
  @media (max-width: 500px) {
    display: none;
  }
`;

const Logo = styled("img")`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
`;

const NavigationContainer = styled("nav")`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  margin-right: 10px;
`;

const LinkContainer = styled("div")<{primary: boolean}>`
  display: flex;
  align-items: center;
  font-size: 18px;
  transition: 0.2s;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  height: 50px;
  padding-left: 10px;
  padding-right: 15px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }  

  && {
    ${props => (
    props.primary ? `
        background-color: var(--primary-color);
        opacity: 0.9;
        transition: 0.2s;
        &:hover {
          opacity: 1;
        }
      ` : undefined
  )}
  }

`;

const linkIconStyle = css`
  margin-right: 5px;
`;

export default function PageHeader(props: { hideAccountInfo?: boolean}) {
  const [user, setUser] = createSignal<null | false | RawUser>(null);

  onMount(async () => {
    if (props.hideAccountInfo) {
      return;
    }
    if (!getStorageString(StorageKeys.USER_TOKEN, null)) {
      return setUser(false);
    }
    const details = await getUserDetailsRequest();
    if (!details) {
      return setUser(false);
    }
    setUser(details.user);
  });

  return (
    <HeaderContainer class="header-container">
      <A href="/" class={titleContainerStyle}>
        <Logo src={appLogoUrl()} alt="logo"/>
        <Title>{env.APP_NAME}</Title>
      </A>
      <Show when={user() === false}><LoggedOutLinks/></Show>
      <Show when={user()}><LoggedInLinks user={user() as RawUser}/></Show>
    </HeaderContainer>
  );
}

function LoggedInLinks (props: {user: RawUser}) {
  const [t] = useTransContext();

  return (
    <NavigationContainer class="navigation-container">
      <HeaderLink href='#' label={t("header.accountButton")} />
      <HeaderLink href='/app' label={t("header.openAppButton")} primary={true} icon='open_in_browser' />
    </NavigationContainer>
  );
}

function LoggedOutLinks() {
  const [t] = useTransContext();
  return (
    <NavigationContainer class="navigation-container">
      <HeaderLink href='/login' label={t("header.loginButton")} icon='login' />
      <HeaderLink href='/register' label={t("header.joinNowButton")} primary={true} icon="add" />
    </NavigationContainer>
  );
}

function HeaderLink(props: { icon?: string, href: string, label: string, primary?: boolean }) {
  return (
    <a href={props.href} style={{"text-decoration": "none"}}>
      <LinkContainer primary={props.primary || false}>
        <Show when={props.icon}><Icon name={props.icon} class={linkIconStyle} /></Show>
        {props.label}
      </LinkContainer>
    </a>
  );
}
