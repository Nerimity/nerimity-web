import PageHeader from "../components/PageHeader";
import { styled } from "solid-styled-components";
import PageFooter from "@/components/PageFooter";
import { useParams, useSearchParams } from "solid-navigator";
import { InviteBotPopup } from "@/components/InviteBotPopup";

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Content = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 8px;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 8px;
  flex: 1;
  align-items: center;
`;

export default function InviteServerBotPage() {
  const params = useParams<{ appId: string }>();
  const [searchParams] = useSearchParams<{ perms: string }>();
  const permissions = () =>
    searchParams.perms ? parseInt(searchParams.perms) : 0;
  return (
    <HomePageContainer>
      <PageHeader />
      <Content class="content">
        <div
          style={{
            display: "flex",
            "padding-top": "20px",
            "padding-bottom": "20px",
            margin: "auto",
          }}
        >
          <InviteBotPopup appId={params.appId} permissions={permissions()} />
        </div>
      </Content>
      <PageFooter />
    </HomePageContainer>
  );
}
