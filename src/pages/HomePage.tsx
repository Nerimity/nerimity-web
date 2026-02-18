import style from "./HomePage.module.css";
import env from "@/common/env";
import Button from "@/components/ui/Button";
import { useNavigate } from "solid-navigator";
import PageHeader from "../components/PageHeader";
import Text from "@/components/ui/Text";
import Icon from "@/components/ui/icon/Icon";
import PageFooter from "@/components/PageFooter";
import { getPlatformDownloadLinks } from "@/github-api";
import ContextMenu, {
  ContextMenuItem
} from "@/components/ui/context-menu/ContextMenu";
import { createSignal } from "solid-js";
import { toast } from "@/components/ui/custom-portal/CustomPortal";
import { useTransContext } from "@nerimity/solid-i18lite";

export default function HomePage() {
  const [t] = useTransContext();
  const isRelease = env.APP_VERSION?.startsWith("v");

  const releaseLink = isRelease
    ? `https://github.com/Nerimity/nerimity-web/releases/${
        env.APP_VERSION ? `tag/${env.APP_VERSION}` : ""
      }`
    : "https://github.com/Nerimity/nerimity-web/commits/main";

  return (
    <div class={style.homePageContainer}>
      <PageHeader />
      <div class={style.content}>
        <div class={style.topContainer}>
          <a
            class={style.versionAnchor}
            href={releaseLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {env.APP_VERSION || "Unknown Version"}
          </a>

          <Text class={style.slogan} size={36} bold>
            {t("homePage.slogan")}
          </Text>
          <Text size={18} opacity={0.7} class={style.subslogan}>
            {t("homePage.subslogan")}
          </Text>
          <div class={style.buttonsContainer}>
            <a href="/register">
              <Button
                class={style.getStartedButton}
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
          </div>
          <PlatformDownloadLinks />
        </div>
        <FeatureList />
      </div>
      <PageFooter />
    </div>
  );
}

const PlatformDownloadLinks = () => {
  const [t] = useTransContext();
  const navigate = useNavigate();
  const [macOSMenuPos, setMacOSMenuPos] = createSignal<
    { x: number; y: number } | undefined
  >();
  const [linuxMenuPos, setLinuxMenuPos] = createSignal<
    { x: number; y: number } | undefined
  >();

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
      onClick: () => onClick("macos", "x64")
    },
    {
      label: "Apple Silicon (M1/M2/M3/...)",
      icon: "laptop_mac",
      onClick: () => onClick("macos", "arm64")
    }
  ];

  const linuxMenuItems: ContextMenuItem[] = [
    {
      label: "Debian/Ubuntu (deb)",
      icon: "download",
      onClick: () => onClick("linux", "deb")
    },
    {
      label: "AppImage",
      icon: "download",
      onClick: () => onClick("linux", "AppImage")
    }
  ];

  return (
    <div class={style.platformDownloadContainer}>
      <Text size={16} opacity={0.7}>
        {t("homePage.availableOn")}
      </Text>
      <div class={style.platformDownloadButtons}>
        <Button
          onClick={() => navigate("/register")}
          color=""
          customChildren={
            <div class={style.downloadButton}>
              <Text>{t("homePage.browser")}</Text>
              <Text opacity={0.8} size={12}>
                web
              </Text>
            </div>
          }
          iconName="public"
          primary
        />
        <Button
          onClick={() => onClick("windows")}
          color=""
          customChildren={
            <div class={style.downloadButton}>
              <Text>Windows</Text>
              <Text opacity={0.8} size={12}>
                exe
              </Text>
            </div>
          }
          iconName="grid_view"
          primary
        />
        <Button
          onClick={(e) => onMacOSButtonClick(e as MouseEvent)}
          color=""
          customChildren={
            <div class={style.downloadButtonOuter}>
              <img src="/assets/apple.svg" width={24} />
              <div class={style.downloadButton}>
                <Text>macOS</Text>
                <Text opacity={0.8} size={12}>
                  dmg
                </Text>
              </div>
            </div>
          }
          primary
        />
        <Button
          onClick={() => onClick("android")}
          color="#31a952"
          customChildren={
            <div class={style.downloadButton}>
              <Text>Android</Text>
              <Text opacity={0.8} size={12}>
                apk
              </Text>
            </div>
          }
          iconName="android"
          primary
        />
        <Button
          onClick={(e) => onLinuxButtonClick(e as MouseEvent)}
          color="#db5c13"
          customChildren={
            <div class={style.downloadButtonOuter}>
              <img src="/assets/linux.svg" width={24} />
              <div class={style.downloadButton}>
                <Text>Linux</Text>
                <Text opacity={0.8} size={12}>
                  deb / AppImage
                </Text>
              </div>
            </div>
          }
          primary
        />
      </div>
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
    </div>
  );
};

function FeatureList() {
  const [t] = useTransContext();
  return (
    <div class={style.featureListContainer}>
      <Feature icon="gif" label={t("homePage.featureList.feature1")} />
      <Feature icon="preview" label={t("homePage.featureList.feature2")} />
      <Feature icon="sell" label={t("homePage.featureList.feature3")} />
      <Feature icon="add" label={t("homePage.featureList.feature4")} />
      <Feature icon="dns" label={t("homePage.featureList.feature5")} />
      <Feature icon="explore" label={t("homePage.featureList.feature6")} />
      <Feature
        icon="volunteer_activism"
        label={t("homePage.featureList.feature7")}
      />
      <Feature icon="code" label={t("homePage.featureList.feature8")} />
      <Feature
        icon="account_circle"
        label={t("homePage.featureList.feature9")}
      />
    </div>
  );
}

function Feature(props: { icon: string; label: string }) {
  return (
    <div class={style.featureContainer}>
      <Icon class={style.icon} name={props.icon} size={26} />
      <Text size={14} opacity={0.7}>
        {props.label}
      </Text>
    </div>
  );
}
