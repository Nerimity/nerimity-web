import PageHeader from '../components/PageHeader'
import { styled } from 'solid-styled-components'
import { FlexColumn } from '@/components/ui/Flexbox'
import PageFooter from '@/components/PageFooter'
import { useParams, useSearchParams } from '@solidjs/router';
import { onMount } from 'solid-js';

const PageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  display: flex;
  flex-direction: column;
  background: var(--pane-color);
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
`;

const CenterContainer = styled(FlexColumn)`
  gap: 30px;
  margin: 30px;
  margin-top: 50px;
  max-width: 800px;
  align-self: center;
`;

export default function GoogleRedirectLinkAccountPage() {
  const [searchParams] = useSearchParams<{state: string, code: string}>();


  onMount(() => {
    const userToken = searchParams.state;
    const code = searchParams.code;
  })



  return (
    <PageContainer class="page-container">
      <PageHeader showLogo={false} />
      <Content class='content'>
        <CenterContainer>

          Linking your account with Google...

        </CenterContainer>
      </Content>
      <PageFooter/>
    </PageContainer>
  )
}