import { A } from "solid-navigator";
import { Show, createEffect, createSignal, on } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Avatar from "@/components/ui/Avatar";
import { css, styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { bannerUrl } from "@/chat-api/store/useUsers";
import { Banner } from "../ui/Banner";
import { useWindowProperties } from "@/common/useWindowProperties";
import { FriendStatus, RawUser } from "@/chat-api/RawData";
import { settingsHeaderPreview } from "./settingsHeaderPreview";
import { t } from "@nerimity/i18lite";

const HeaderContainer = styled("div")`
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding-left: 30px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  height: 100%;
`;

const DetailsContainer = styled(FlexColumn)`
  margin-left: 20px;
  margin-right: 20px;
  font-size: 18px;
  z-index: 1111;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(34px);
  padding: 10px;
  border-radius: 8px;
`;

const UsernameTagContainer = styled(FlexRow)`
  font-size: 16px;
  margin-bottom: 5px;
  overflow-wrap: anywhere;
  overflow: hidden;
  line-height: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* number of lines to show */
  line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const avatarStyles = css`
  z-index: 111;
`;

const CustomAvatar = styled("div")<{ cropPosition: string }>`
  width: 100%;
  height: 100%;
  background-repeat: no-repeat !important;
  border-radius: 50%;
  ${(props) => props.cropPosition}
`;

const CustomBanner = styled("div")<{ cropPosition: string }>`
  position: absolute;
  inset: 0;
  ${(props) => props.cropPosition}
`;

const SettingsHeader = (props: { bot?: RawUser }) => {
  const [avatarEl, setAvatarEl] = createSignal<HTMLDivElement | undefined>();
  const [bannerEl, setBannerEl] = createSignal<HTMLDivElement | undefined>();
  const { account, servers, friends } = useStore();
  const user = () => account.user();
  const serverCount = () => servers.array().length || "0";
  const friendCount = () =>
    friends.array().filter((friend) => friend.status === FriendStatus.FRIENDS)
      .length || "0";
  const { width } = useWindowProperties();

  const [imageDimensions, setImageDimensions] = createSignal({
    height: 0,
    width: 0,
  });
  const [bannerDimensions, setBannerDimensions] = createSignal({
    height: 0,
    width: 0,
  });

  createEffect(
    on(
      () => settingsHeaderPreview.avatar,
      (val) => {
        if (!val) return;
        getImageDimensions(val).then(setImageDimensions);
      },
    ),
  );

  createEffect(
    on(
      () => settingsHeaderPreview.banner,
      (val) => {
        if (!val) return;
        getImageDimensions(val).then(setBannerDimensions);
      },
    ),
  );

  const avatarSize = () => (width() <= 500 ? 70 : 100);

  const cropPosition = () => {
    const coordinates = settingsHeaderPreview.avatarPoints;
    if (!coordinates) return "";
    const viewWidth = (avatarSize() && avatarEl()?.clientWidth) || 0;
    const viewHeight = (avatarSize() && avatarEl()?.clientHeight) || 0;
    const imageWidth = imageDimensions().width;
    const imageHeight = imageDimensions().height;
    const offsetX = coordinates[0];
    const offsetY = coordinates[1];
    const scaleX = viewWidth / (coordinates[2] - coordinates[0]);
    const scaleY = viewHeight / (coordinates[3] - coordinates[1]);
    return `
      background-position: -${offsetX * scaleX}px -${offsetY * scaleY}px !important;
      background-size: ${imageWidth * scaleX}px ${imageHeight * scaleY}px !important;
    `;
  };

  const bannerCropPosition = () => {
    const coordinates = settingsHeaderPreview.bannerPoints;
    if (!coordinates) return "";
    const viewWidth = bannerEl()?.clientWidth || 0;
    const viewHeight = bannerEl()?.clientHeight || 0;
    const imageWidth = bannerDimensions().width;
    const imageHeight = bannerDimensions().height;
    const offsetX = coordinates[0];
    const offsetY = coordinates[1];
    const scaleX = viewWidth / (coordinates[2] - coordinates[0]);
    const scaleY = viewHeight / (coordinates[3] - coordinates[1]);
    return `
      background-position: -${offsetX * scaleX}px -${offsetY * scaleY}px !important;
      background-size: ${imageWidth * scaleX}px ${imageHeight * scaleY}px !important;
      background-repeat: no-repeat !important;
    `;
  };

  async function getImageDimensions(imageUrl: string) {
    const img = new Image();
    img.src = imageUrl;
    await img.decode();
    return { width: img.width, height: img.height };
  }

  return (
    <Show when={user()}>
      <Banner
        ref={setBannerEl}
        maxHeight={250}
        margin={props.bot ? 0 : undefined}
        animate
        hexColor={props.bot?.hexColor || user()?.hexColor}
        url={
          settingsHeaderPreview.bannerPoints
            ? undefined
            : settingsHeaderPreview.banner || bannerUrl(props.bot || user()!)
        }
      >
        <Show
          when={
            settingsHeaderPreview.bannerPoints && settingsHeaderPreview.banner
          }
        >
          <CustomBanner
            ref={setBannerEl}
            cropPosition={bannerCropPosition()}
            style={{ background: `url("${settingsHeaderPreview.banner}")` }}
          />
        </Show>
        <HeaderContainer>
          <Avatar
            animate
            user={props.bot || account.user()!}
            size={avatarSize()}
            class={avatarStyles}
          >
            {settingsHeaderPreview.avatar ? (
              <CustomAvatar
                ref={setAvatarEl}
                cropPosition={cropPosition()}
                style={{ background: `url("${settingsHeaderPreview.avatar}")` }}
              />
            ) : null}
          </Avatar>
          <DetailsContainer>
            <UsernameTagContainer>
              <Text>
                {settingsHeaderPreview.username ||
                  props.bot?.username ||
                  user()!.username}
              </Text>
              <Show
                when={
                  settingsHeaderPreview.tag || props.bot?.tag || user()!.tag
                }
              >
                <Text opacity={0.7}>
                  :{settingsHeaderPreview.tag || props.bot?.tag || user()!.tag}
                </Text>
              </Show>
            </UsernameTagContainer>
            <Show when={!props.bot}>
              <FlexRow gap={5}>
                <Text size={14} opacity={0.8}>
                  {serverCount()} {t("settings.header.servers")}
                </Text>
                <Text size={14}>•</Text>
                <Text size={14} opacity={0.8}>
                  {friendCount()} {t("settings.header.friends")}
                </Text>
              </FlexRow>
              <Text size={14}>
                <A href="/app/settings/account">
                  {t("settings.header.manageAccount")}
                </A>
              </Text>
            </Show>
          </DetailsContainer>
        </HeaderContainer>
      </Banner>
    </Show>
  );
};

export default SettingsHeader;
