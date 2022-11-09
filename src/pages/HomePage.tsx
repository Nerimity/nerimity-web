import env from '@/common/env'
import Button from '@/components/ui/Button'
import { Link } from '@nerimity/solid-router'
import PageHeader from '../components/PageHeader'
import { styled } from 'solid-styled-components'
import Text from '@/components/ui/Text'

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
const Content = styled("div")`
  padding-top: 90px;
`;

const ArtImage = styled("img")`
  position: fixed;
  bottom: 0;
  right: 0;
  width: auto;
  height: 100%;
  opacity: 0.02;
  pointer-events: none;
  @media (orientation: portrait) {
    width: 100%;
    height: auto;
  }
`;

const TopContainer = styled("div")`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 400px;
  margin-left: 40px;
`;

const ButtonsContainer = styled("div")`
  margin-top: 10px;;
  display: flex;
  margin-left: -5px;

  a {
    text-decoration: none;
    div {
      width: 130px;
    }
  }
`;

export default function HomePage () {
  return (
    <HomePageContainer class="home-page-container">
      <PageHeader />
      <Content class='content'>
        <TopContainer>
          <Text class="title" size={60}>{env.APP_NAME}</Text>
          <Text class="slogan" opacity={0.7}>A modern and sleek chat app.</Text>
          <ButtonsContainer class="buttons-container">
            <Link href='/register'><Button iconName='open_in_browser' label='Join Nerimity' primary={true} /></Link>
            <a href="https://github.com/Nerimity/nerimity-web" target="_blank" rel="noopener noreferrer"><Button color='white' iconName='code' label='View GitHub'  /></a>
          </ButtonsContainer>
        </TopContainer>
      </Content>
      <ArtImage src="./assets/home-page-art.svg" alt=""/>
    </HomePageContainer>
  )
}

