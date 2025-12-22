import env from "@/common/env";
import Button from "@/components/ui/Button";
import { useNavigate } from "solid-navigator";
import PageHeader from "../components/PageHeader";
import { css, styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Icon from "@/components/ui/icon/Icon";
import PageFooter from "@/components/PageFooter";
import { getPlatformDownloadLinks } from "@/github-api";
import ContextMenu, { ContextMenuItem } from "@/components/ui/context-menu/ContextMenu";
import { createSignal } from "solid-js";
import { toast } from "@/components/ui/custom-portal/CustomPortal";
import { t } from "@nerimity/i18lite";
import { Rerun } from "@solid-primitives/keyed";
import { getCurrentLanguage } from "@/locales/languages";

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  z-index: 1111;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    max-width: 400px;
    aspect-ratio: 1/1;
    width: 50%;
    background-color: var(--primary-color);
    align-self: center;
    border-radius: 9999px;
    filter: blur(200px);
    opacity: 0.6;
    z-index: -1;
  }
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
  const isRelease = env.APP_VERSION?.startsWith("v");

  const releaseLink = isRelease
    ? `https://github.com/Nerimity/nerimity-web/releases/${
        env.APP_VERSION ? `tag/${env.APP_VERSION}` : ""
      }`
    : "https://github.com/Nerimity/nerimity-web/commits/main";

  return (
    <Rerun on={getCurrentLanguage}>
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
        <PageFooter />
      </HomePageContainer>
    </Rerun>
  );
}

const downloadButtonStyle = css`
  :nth-child(2) {
    margin-left: 0;
    text-align: end;
  }

  text-align: start;
`;

const PlatformDownloadLinks = () => {
  const navigate = useNavigate();
  const [macOSMenuPos, setMacOSMenuPos] = createSignal<{ x: number; y: number } | undefined>();
  const [linuxMenuPos, setLinuxMenuPos] = createSignal<{ x: number; y: number } | undefined>();

  const onClick = async (
    platform: "windows" | "linux" | "android" | "macos",
    e?: "deb" | "AppImage" | "x64" | "arm64"
  ) => {
    if (platform === "android") {
      window.open(
        "https://github.com/Nerimity/NerimityReactNative/releases/latest",
        "_blank"
      );
      return;
    }

    const platforms = await getPlatformDownloadLinks();
    const filtered = platforms.filter((x) => {
      if (x.platform !== platform) return false;
      if (e) {
        if (x.ext === e) return true;
        // For macOS architectures
        if (platform === "macos") {
          const name = x.name.toLowerCase();
          if (e === "arm64") return name.includes("arm64"); // ARM64 version
          if (e === "x64") return x.ext === "dmg" && !name.includes("arm64"); // Intel
        }
        return false;
      }
      return true;
    });
    if (filtered.length === 0) {
      toast("No platforms found");
      console.log(platforms);
      return;
    }
    if (filtered[0]?.downloadUrl) {
      window.open(filtered[0].downloadUrl, "_blank");
      return;
    }
  };

  const onMacOSButtonClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // when clicking, if already open, close it
    if (macOSMenuPos()) {
      setMacOSMenuPos(undefined);
      return;
    }
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setMacOSMenuPos({ x: rect.left, y: rect.bottom + 5 });
  };

  const onLinuxButtonClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (linuxMenuPos()) {
      setLinuxMenuPos(undefined);
      return;
    }
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setLinuxMenuPos({ x: rect.left, y: rect.bottom + 5 });
  };

  const macOSMenuItems: ContextMenuItem[] = [
    {
      label: "Intel",
      icon: "laptop_mac",
      onClick: () => onClick("macos", "x64"),
    },
    {
      label: "Apple Silicon (M1/M2/M3/...)",
      icon: "laptop_mac",
      onClick: () => onClick("macos", "arm64"),
    },
  ];

  const linuxMenuItems: ContextMenuItem[] = [
    {
      label: "Debian/Ubuntu (deb)",
      icon: "download",
      onClick: () => onClick("linux", "deb"),
    },
    {
      label: "AppImage",
      icon: "download",
      onClick: () => onClick("linux", "AppImage"),
    },
  ];

  return (
    <FlexColumn gap={10} itemsCenter style={{ "margin-top": "10px" }}>
      <Text size={16} opacity={0.7}>
        {t("homePage.availableOn")}
      </Text>
      <FlexRow wrap justifyCenter>
        <Button
          onClick={() => navigate("/register")}
          color=""
          customChildren={
            <FlexColumn class={downloadButtonStyle}>
              <Text>{t("homePage.browser")}</Text>
              <Text opacity={0.8} size={12}>
                web
              </Text>
            </FlexColumn>
          }
          iconName="public"
          primary
        />
        <Button
          onClick={() => onClick("windows")}
          color=""
          customChildren={
            <FlexColumn class={downloadButtonStyle}>
              <Text>Windows</Text>
              <Text opacity={0.8} size={12}>
                exe
              </Text>
            </FlexColumn>
          }
          iconName="grid_view"
          primary
        />
        <Button
          onClick={(e) => onMacOSButtonClick(e as MouseEvent)}
          color=""
          customChildren={
            <FlexRow itemsCenter>
              <img src="/assets/apple.svg" width={24} />
              <FlexColumn class={downloadButtonStyle}>
                <Text>macOS</Text>
                <Text opacity={0.8} size={12}>
                  dmg
                </Text>
              </FlexColumn>
            </FlexRow>
          }
          primary
        />
        <Button
          onClick={() => onClick("android")}
          color="#31a952"
          customChildren={
            <FlexColumn class={downloadButtonStyle}>
              <Text>Android</Text>
              <Text opacity={0.8} size={12}>
                apk
              </Text>
            </FlexColumn>
          }
          iconName="android"
          primary
        />
        <Button
          onClick={(e) => onLinuxButtonClick(e as MouseEvent)}
          color="#db5c13"
          customChildren={
            <FlexRow itemsCenter>
              <img src="/assets/linux.svg" width={24} />
              <FlexColumn class={downloadButtonStyle}>
                <Text>Linux</Text>
                <Text opacity={0.8} size={12}>
                  deb / AppImage
                </Text>
              </FlexColumn>
            </FlexRow>
          }
          primary
        />
      </FlexRow>
      <ContextMenu
        items={macOSMenuItems}
        position={macOSMenuPos()}
        onClose={() => setMacOSMenuPos(undefined)}
      />
      <ContextMenu
        items={linuxMenuItems}
        position={linuxMenuPos()}
        onClose={() => setLinuxMenuPos(undefined)}
      />
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
  padding: 10px;
  z-index: 1111;
  margin: 10px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 90%;
    width: 100%;
  }
`;

function FeatureList() {
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
  border: solid 1px rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 6px;
  padding-right: 14px;
`;

function Feature(props: { icon: string; label: string }) {
  return (
    <FeatureContainer gap={10}>
      <Icon
        style={{
          background: "rgba(255,255,255,0.06)",
          padding: "10px",
          "border-radius": "12px",
        }}
        name={props.icon}
        size={26}
      />
      <Text size={14} opacity={0.7}>
        {props.label}
      </Text>
    </FeatureContainer>
  );
}
