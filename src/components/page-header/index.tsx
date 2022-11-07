import styles from './styles.module.scss'
import { Link } from '@nerimity/solid-router'
import { classNames, conditionalClass } from '@/common/classNames'
import env from '@/common/env'
import { getUserDetailsRequest } from '@/chat-api/services/UserService'
import { createSignal, Match, onMount, Show, Switch } from 'solid-js'
import { RawUser } from '@/chat-api/RawData'
import { getStorageString, StorageKeys } from '@/common/localStorage'
import Icon from '../ui/icon'
import { isHalloween } from '@/worldEvents'
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
    <header class={styles.header}>
      <a href="/" class={styles.title}>
        <Switch fallback={<img class={styles.logo} src="/assets/logo.png" alt="User Avatar" />}>
          <Match when={isHalloween}>
            <img class={styles.logo} src="/assets/halloween-logo.png" alt="User Avatar" />
          </Match>
        </Switch>
        <div class={styles.titleName}>{env.APP_NAME}</div>
      </a>
      {user() === false && <LoggedOutLinks/>}
      {user() && <LoggedInLinks user={user() as RawUser}/>}
    </header>
  )
}

function LoggedInLinks (props: {user: RawUser}) {
  return (
    <nav class={styles.navigation}>
      <HeaderLink href='#' label='Account' />
      <HeaderLink href='/app' label='Open App' primary={true} icon='open_in_browser' />
    </nav>
  )
}

function LoggedOutLinks() {
  return (
    <nav class={styles.navigation}>
      <HeaderLink href='/login' label='Login' icon='login' />
      <HeaderLink href='/register' label='Join Now' primary={true} icon="add" />
    </nav>
  )
}



function HeaderLink(props: { icon?: string, href: string, label: string, primary?: boolean }) {
  return (
    <Link
      href={props.href}
      class={classNames(
        styles.link, 
        // conditionalClass(isSelected(), styles.selected),
        conditionalClass(props.primary, styles.primary)
      )}
    >
      {props.icon && <Icon name={props.icon} class={styles.icon} />}
      {props.label}
    </Link>
  )
}
