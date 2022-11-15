import { createSignal, Match, onMount, Show, Switch } from 'solid-js'
import { css, styled } from 'solid-styled-components'
import { Link } from '@nerimity/solid-router'
import env from '@/common/env'
import { getUserDetailsRequest } from '@/chat-api/services/UserService'
import { RawUser } from '@/chat-api/RawData'
import { getStorageString, StorageKeys } from '@/common/localStorage'
import Icon from './ui/icon/Icon'
import { isHalloween } from '@/common/worldEvents'


const HeaderContainer = styled("header")`
  display: flex;
  height: 70px;
  flex-shrink: 0;
  border: solid rgba(255, 255, 255, 0.1) 1px;
  background-color: rgba(67, 67, 67, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  position: fixed;
  inset: 15px;
  z-index: 11111;
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
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
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

export default function PageHeader() {
  const [user, setUser] = createSignal<null | false | RawUser>(null);

  onMount(async () => {
    if (!getStorageString(StorageKeys.USER_TOKEN, null)) {
      return setUser(false);
    }
    const details = await getUserDetailsRequest()
    if (!details) {
      return setUser(false);
    }
    setUser(details.user);
  })

  return (
    <HeaderContainer class="header-container">
      <Link href="/" class={titleContainerStyle}>
        <Switch fallback={<Logo src="/assets/logo.png" alt="User Avatar" />}>
          <Match when={isHalloween}>
            <Logo src="/assets/halloween-logo.png" alt="User Avatar" />
          </Match>
        </Switch>
        <Title>{env.APP_NAME}</Title>
      </Link>
      <Show when={user() === false}><LoggedOutLinks/></Show>
      <Show when={user()}><LoggedInLinks user={user() as RawUser}/></Show>
    </HeaderContainer>
  )
}

function LoggedInLinks (props: {user: RawUser}) {
  return (
    <NavigationContainer class="navigation-container">
      <HeaderLink href='#' label='Account' />
      <HeaderLink href='/app' label='Open App' primary={true} icon='open_in_browser' />
    </NavigationContainer>
  )
}

function LoggedOutLinks() {
  return (
    <NavigationContainer class="navigation-container">
      <HeaderLink href='/login' label='Login' icon='login' />
      <HeaderLink href='/register' label='Join Now' primary={true} icon="add" />
    </NavigationContainer>
  )
}

function HeaderLink(props: { icon?: string, href: string, label: string, primary?: boolean }) {
  return (
    <Link href={props.href} style={{"text-decoration": 'none'}}>
      <LinkContainer primary={props.primary || false}>
        <Show when={props.icon}><Icon name={props.icon} class={linkIconStyle} /></Show>
        {props.label}
      </LinkContainer>
    </Link>
  )
}
