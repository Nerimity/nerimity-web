import { A, useParams } from "solid-navigator";
import { Show, createEffect, createSignal, on, createMemo } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Avatar from "@/components/ui/Avatar";
import RouterEndpoints from "@/common/RouterEndpoints";
import { css, styled } from "solid-styled-components";
import Text from "@/components/ui/Text";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { ServerVerifiedIcon } from "../../ServerVerifiedIcon";
import { useTransContext } from "@nerimity/solid-i18lite";
import { avatarUrl, bannerUrl } from "@/chat-api/store/useServers";
import { Banner } from "@/components/ui/Banner";
import { useWindowProperties } from "@/common/useWindowProperties";
import { serverSettingsHeaderPreview } from "./serverSettingsHeaderPreview";

const HeaderContainer = styled("div")`
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding-left: 30px;
  flex-shrink: 0;
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

const avatarStyles = css`
  z-index: 111;
`;

const CustomAvatar = styled("div")<{ cropPosition: string }>`
  width: 100%;
  height: 100%;
  background-repeat: no-repeat !important;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  ${(props) => props.cropPosition}
`;

const CustomBanner = styled("div")<{ cropPosition: string }>`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  ${(props) => props.cropPosition}
`;

const ServerSettingsHeader = () => {
  const [t] = useTransContext();
  const params = useParams();
  const { servers, serverMembers } = useStore();
  const server = () => servers.get(params.serverId!);
  const serverMembersCount = () => serverMembers.array(params.serverId!).length;
  const { width } = useWindowProperties();

  const [avatarEl, setAvatarEl] = createSignal<HTMLDivElement>();
  const [bannerEl, setBannerEl] = createSignal<HTMLDivElement>();
  const [imgDim, setImgDim] = createSignal({ width: 0, height: 0 });
  const [bannerDim, setBannerDim] = createSignal({ width: 0, height: 0 });

  async function getImageDimensions(imageUrl: string) {
    const img = new Image();
    img.src = imageUrl;
    await img.decode();
    return { width: img.width, height: img.height };
  }

  createEffect(
    on(
      () => serverSettingsHeaderPreview.avatar,
      (val) => {
        if (val) getImageDimensions(val).then(setImgDim);
      },
    ),
  );

  createEffect(
    on(
      () => serverSettingsHeaderPreview.banner,
      (val) => {
        if (val) getImageDimensions(val).then(setBannerDim);
      },
    ),
  );

  const avatarCropStyle = createMemo(() => {
    const coords = serverSettingsHeaderPreview.avatarPoints;
    const el = avatarEl();
    const dims = imgDim();
    if (!coords || !el || !dims.width) return "";
    const scaleX = el.clientWidth / (coords[2] - coords[0]);
    const scaleY = el.clientHeight / (coords[3] - coords[1]);
    return `
      background-position: -${coords[0] * scaleX}px -${
        coords[1] * scaleY
      }px !important;
      background-size: ${dims.width * scaleX}px ${
        dims.height * scaleY
      }px !important;
    `;
  });

  const bannerCropStyle = createMemo(() => {
    const coords = serverSettingsHeaderPreview.bannerPoints;
    const el = bannerEl();
    const dims = bannerDim();
    if (!coords || !el || !dims.width) return "";
    const scaleX = el.clientWidth / (coords[2] - coords[0]);
    const scaleY = el.clientHeight / (coords[3] - coords[1]);
    return `
      background-position: -${coords[0] * scaleX}px -${
        coords[1] * scaleY
      }px !important;
      background-size: ${dims.width * scaleX}px ${
        dims.height * scaleY
      }px !important;
      background-repeat: no-repeat !important;
    `;
  });

  return (
    <Show when={server()}>
      <Banner
        maxHeight={250}
        animate
        url={
          serverSettingsHeaderPreview.banner ? undefined : bannerUrl(server()!)
        }
        hexColor={server()?.hexColor}
      >
        {serverSettingsHeaderPreview.banner ? (
          <CustomBanner
            ref={setBannerEl}
            cropPosition={bannerCropStyle()}
            style={{
              background: `url("${serverSettingsHeaderPreview.banner}")`,
            }}
          />
        ) : null}
        <HeaderContainer>
          <Avatar
            animate
            url={
              serverSettingsHeaderPreview.avatar
                ? undefined
                : avatarUrl(server()!)
            }
            server={server()}
            size={width() <= 1100 ? 70 : 100}
            class={avatarStyles}
          >
            {serverSettingsHeaderPreview.avatar ? (
              <CustomAvatar
                ref={setAvatarEl}
                cropPosition={avatarCropStyle()}
                style={{
                  background: `url("${serverSettingsHeaderPreview.avatar}")`,
                }}
              />
            ) : null}
          </Avatar>
          <DetailsContainer>
            <FlexRow gap={5}>
              <Text>{serverSettingsHeaderPreview.name || server()!.name}</Text>
              <Show when={server()?.verified}>
                <ServerVerifiedIcon />
              </Show>
            </FlexRow>
            <Text size={14} opacity={0.8}>
              {t("servers.settings.header.serverMemberCount", {
                count: serverMembersCount(),
              })}
            </Text>
            <Text size={14}>
              <A href={RouterEndpoints.SERVER_SETTINGS_GENERAL(server()!.id)}>
                {t("servers.settings.header.editServer")}
              </A>
            </Text>
          </DetailsContainer>
        </HeaderContainer>
      </Banner>
    </Show>
  );
};

export default ServerSettingsHeader;
