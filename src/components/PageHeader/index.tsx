import { Link, useLocation } from 'solid-app-router'
import { classNames, conditionalClass } from '../../common/classNames'
import env from '../../common/env'
import styles from './styles.module.scss'
export default function PageHeader() {
  
  return (
    <header class={styles.header}>
      <div class={styles.title}>{env.APP_NAME}</div>
      <nav class={styles.navigation}>
        <HeaderLink href='/' label='Home' />
        <HeaderLink href='/register' label='Register' />
        <HeaderLink href='/login' label='Login' />
      </nav>
    </header>
  )
}


function HeaderLink(props: { href: string, label: string }) {
  const location = useLocation();
  const isSelected = () => props.href === location.pathname;
  return (
    <Link 
      href={props.href}
      class={classNames(styles.link, conditionalClass(isSelected(), styles.selected))}
    >
      {props.label}
    </Link>
  )
}
