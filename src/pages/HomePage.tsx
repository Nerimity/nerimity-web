import env from "@/common/env";
import Button from "@/components/ui/Button";
import { useNavigate } from "solid-navigator";
import PageHeader from "../components/PageHeader";
import { styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { appLogoUrl } from "@/common/worldEvents";
import { useTransContext } from "@mbarzda/solid-i18next";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Icon from "@/components/ui/icon/Icon";
import { CustomLink } from "@/components/ui/CustomLink";
import PageFooter from "@/components/PageFooter";

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
`;

const ArtImage = styled("img")`
  position: absolute;
  bottom: 0;
  right: 0;
  width: auto;
  height: 100%;
  opacity: 0.01;
  pointer-events: none;
  @media (orientation: portrait) {
    width: 100%;
    height: auto;
  }
`;

const TopContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 490px;
  text-align: center;
  flex-shrink: 0;
  .slogan {
    background: #4c93ff;
    background: linear-gradient(to right, #4c93ff 0%, #6a5dff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const ButtonsContainer = styled("div")`
  margin-top: 10px;
  display: flex;
  margin-left: -5px;

  a {
    text-decoration: none;
    div {
      width: 130px;
    }
  }
  .get-started-button {
    background: #4c93ff;
    background: linear-gradient(to right, #4c93ff 0%, #6a5dff 100%);
  }
`;

const Logo = styled("img")`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
`;

const VersionAnchor = styled("a")`
  margin-bottom: 26px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--primary-color);
  text-decoration: none;
  padding: 6px;
  font-size: 14px;
  padding-left: 12px;
  padding-right: 12px;
`;

export default function HomePage() {
  const [t] = useTransContext();

  const isRelease = env.APP_VERSION?.startsWith("v");

  const releaseLink = isRelease
    ? `https://github.com/Nerimity/nerimity-web/releases/${
        env.APP_VERSION ? `tag/${env.APP_VERSION}` : ""
      }`
    : "https://github.com/Nerimity/nerimity-web/commits/main";

  return (
    <HomePageContainer class="home-page-container">
      <PageHeader />
      <Content class="content">
        <TopContainer class="top-container">
          <VersionAnchor
            href={releaseLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {env.APP_VERSION || "Unknown Version"}
          </VersionAnchor>

          <Text class="slogan" size={36} bold>
            {t("homePage.slogan")}
          </Text>
          <Text
            size={18}
            opacity={0.7}
            style={{ "margin-top": "10px", "margin-bottom": "10px" }}
          >
            {t("homePage.subslogan")}
          </Text>
          <ButtonsContainer class="buttons-container">
            <a href="/register">
              <Button
                class="get-started-button"
                iconName="open_in_browser"
                label={t("homePage.getStarted")!}
                color={"white"}
              />
            </a>
            <a
              href="https://github.com/Nerimity/nerimity-web"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                color="white"
                iconName="code"
                label={t("homePage.viewGitHubButton")!}
              />
            </a>
          </ButtonsContainer>
          <PlatformDownloadLinks />
        </TopContainer>
        <FeatureList />
      </Content>
      <ArtImage src="./assets/home-page-art.svg" alt="" />
      <PageFooter />
    </HomePageContainer>
  );
}

const PlatformDownloadLinks = () => {
  const [t] = useTransContext();
  const navigate = useNavigate();
  return (
    <FlexColumn gap={10} itemsCenter style={{ "margin-top": "10px" }}>
      <Text size={16} opacity={0.7} style={{}}>
        {t("homePage.availableOn")}
      </Text>
      <FlexRow wrap justifyCenter>
        <Button
          onClick={() => navigate("/register")}
          color=""
          label={t("homePage.browser")}
          iconName="public"
          primary
        />
        <Button
          onClick={() =>
            window.open(
              "https://github.com/Nerimity/nerimity-desktop/releases/latest",
              "_blank"
            )
          }
          color=""
          label="Windows"
          iconName="grid_view"
          primary
        />
        <Button
          onClick={() =>
            window.open(
              "https://github.com/Nerimity/NerimityReactNative/releases/latest",
              "_blank"
            )
          }
          color="#31a952"
          customChildren={
            <FlexRow itemsCenter>
              <Text>Android</Text>
            </FlexRow>
          }
          iconName="android"
          primary
        />
      </FlexRow>
    </FlexColumn>
  );
};

const FeatureListContainer = styled("div")`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 800px;
  gap: 10px;
  column-gap: 20px;
  align-self: center;
  margin-top: 100px;
  background-color: var(--pane-color);
  border: solid 1px rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
  backdrop-filter: blur(34px);
  z-index: 1111;
  margin: 10px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

function FeatureList() {
  const [t] = useTransContext();
  return (
    <FeatureListContainer>
      <Feature icon="gif" label={t("homePage.featureList.feature1")} />
      <Feature icon="preview" label={t("homePage.featureList.feature2")} />
      <Feature icon="sell" label={t("homePage.featureList.feature3")} />
      <Feature icon="add" label={t("homePage.featureList.feature4")} />
      <Feature icon="dns" label={t("homePage.featureList.feature5")} />
      <Feature icon="explore" label={t("homePage.featureList.feature6")} />
      <Feature icon="volunteer_activism" label={t("homePage.featureList.feature7")} />
      <Feature icon="code" label={t("homePage.featureList.feature8")} />
      <Feature icon="account_circle" label={t("homePage.featureList.feature9")} />
    </FeatureListContainer>
  );
}

const FeatureContainer = styled(FlexRow)`
  align-items: center;
`;

function Feature(props: { icon: string; label: string }) {
  return (
    <FeatureContainer gap={10}>
      <Icon
        style={{
          background: "rgba(255,255,255,0.05)",
          padding: "10px",
          "border-radius": "50%",
        }}
        name={props.icon}
        size={26}
      />
      <Text style={{ "font-weight": "bold" }} size={14} opacity={0.8}>
        {props.label}
      </Text>
    </FeatureContainer>
  );
}
