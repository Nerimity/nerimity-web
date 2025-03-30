import PageHeader from "../components/PageHeader";
import { styled } from "solid-styled-components";
import { FlexColumn } from "@/components/ui/Flexbox";
import PageFooter from "@/components/PageFooter";
import { useParams, useSearchParams } from "solid-navigator";
import { Show, createSignal, onMount } from "solid-js";
import { linkAccountWithGoogle } from "@/chat-api/services/UserService";
import Text from "@/components/ui/Text";
import { getOrCreateUploadsFolder } from "@/common/driveAPI";
import { t } from "i18next";

const PageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  display: flex;
  flex-direction: column;
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
`;

const CenterContainer = styled(FlexColumn)`
  gap: 20px;
  margin: 30px;
  margin-top: 50px;
  max-width: 800px;
  align-self: center;
  align-items: center;
  text-align: center;
`;

export default function GoogleRedirectLinkAccountPage() {
  const [searchParams] = useSearchParams<{ state: string; code: string }>();
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  onMount(async () => {
    const code = searchParams.code;
    const userToken = searchParams.state;

    const res = await linkAccountWithGoogle(code!, userToken!).catch((err) => {
      setError(err.message);
    });

    if (!res) return;
    if (res.connection) {
      setSuccess(true);
    }
  });

  return (
    <PageContainer class="page-container">
      <PageHeader hideAccountInfo />
      <Content class="content">
        <CenterContainer>
          {t("googleLink.linkInProcess")}
          <Show when={error()}>
            <Text color="var(--alert-color)">{error()}</Text>
          </Show>
          <Show when={success()}>
            <Text color="var(--success-color)">
              {t("googleLink.linkSuccess")}
            </Text>
          </Show>
        </CenterContainer>
      </Content>
      <PageFooter />
    </PageContainer>
  );
}
