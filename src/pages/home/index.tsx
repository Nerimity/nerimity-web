import styles from './styles.module.scss'
import env from '@/common/env'
import Button from '@/components/ui/button'
import { Link } from 'solid-named-router'
import PageHeader from '../../components/page-header'
export default function HomePage () {
  return (
    <div class={styles.homePage}>
      <PageHeader />
      <Body/>

      <img class={styles.homePageArt} src="./assets/home-page-art.svg" alt=""/>
    </div>
  )
}


function Body () {
  return (
    <div class={styles.body}>
      <TopArea/>
    </div>
  )
}

function TopArea () {
  return (
    <div class={styles.topArea}>
      <DetailsPane/>
    </div>
  )
}


function DetailsPane() {
  return (
    <div class={styles.detailsPane}>
      <div class={styles.title}>{env.APP_NAME}</div>
      <div class={styles.slogan}>A modern and sleek chat app.</div>
      <div class={styles.buttons}>
        <Link to='/register' ><Button iconName='open_in_browser' label='Join Nerimity' primary={true} /></Link>
        <a href="https://github.com/Nerimity/nerimity-web" target="_blank" rel="noopener noreferrer"><Button color='white' iconName='code' label='View GitHub'  /></a>
      </div>
    </div>
  )
}